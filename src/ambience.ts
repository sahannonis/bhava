/* Starlight on the leaf: a few dozen gold specks that twinkle behind everything, like gilt
   catching a lamp. One small canvas, about 24 frames a second, paused when the app is hidden.
   With reduced motion on, the specks are drawn once and stay still. */

type Speck = { x: number; y: number; r: number; phase: number; rate: number; gold: boolean };

export function startStarlight(): void {
  if (document.getElementById('starlight')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'starlight';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dpr = 1, specks: Speck[] = [];

  // one soft round sprite per colour, drawn once and stamped many times
  const sprite = (core: string, halo: string) => {
    const s = document.createElement('canvas'); s.width = s.height = 32;
    const c = s.getContext('2d')!, g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, core); g.addColorStop(0.18, core); g.addColorStop(0.45, halo); g.addColorStop(1, 'rgba(255,220,140,0)');
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
    return s;
  };
  const goldDot = sprite('rgba(255,236,170,1)', 'rgba(214,160,40,0.35)');
  const paleDot = sprite('rgba(255,250,232,1)', 'rgba(255,240,200,0.3)');

  const seed = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const n = Math.round(Math.min(70, Math.max(28, (w * h) / 9000)));
    specks = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.6 + Math.random() * Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
      rate: 0.25 + Math.random() * 0.9,
      gold: Math.random() < 0.7,
    }));
  };

  const draw = (t: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const s of specks) {
      const wave = still ? 0.6 : (Math.sin(s.phase + (t / 1000) * s.rate) + 1) / 2;
      const a = 0.12 + 0.88 * wave * wave * wave; // mostly dim, now and then a bright glint
      const size = s.r * (6 + 4 * wave);
      ctx.globalAlpha = a;
      ctx.drawImage(s.gold ? goldDot : paleDot, s.x - size / 2, s.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  };

  seed();
  if (still) { draw(0); window.addEventListener('resize', () => { seed(); draw(0); }); return; }

  let last = 0, raf = 0;
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    if (t - last < 41) return; // about 24 frames a second is plenty for a twinkle
    last = t;
    draw(t);
  };
  raf = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(loop);
  });
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(seed, 150); });
}
