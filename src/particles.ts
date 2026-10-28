/* Light and ink in the air of a fight: sparks when a card lands, motes when you heal, ink that lifts
   off a fallen foe, and the ground's own weather (embers, dust, wind, mist) drifting low on the leaf.
   One canvas over the fight. It only draws while something is moving, pauses when the app is hidden,
   and does nothing at all with reduced motion on. */

export type Shape = 'dot' | 'spark' | 'ring' | 'ink';
export type BurstOpts = {
  x: number; y: number; color: string;
  count?: number; speed?: number; life?: number; size?: number;
  gravity?: number; spread?: number; angle?: number; shape?: Shape; drag?: number;
};
type P = { back?: boolean; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; shape: Shape; g: number; drag: number; grow: number };
export type Weather = 'fire' | 'earth' | 'air' | 'water';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* soft round sprites, one per colour, made once */
const sprites = new Map<string, HTMLCanvasElement>();
function sprite(color: string, ink = false): HTMLCanvasElement {
  const key = `${color}${ink ? ':ink' : ''}`;
  let s = sprites.get(key);
  if (s) return s;
  s = document.createElement('canvas'); s.width = s.height = 48;
  const c = s.getContext('2d')!, g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
  if (ink) { g.addColorStop(0, color); g.addColorStop(0.5, color); g.addColorStop(1, 'rgba(36,30,21,0)'); }
  else { g.addColorStop(0, '#fffbea'); g.addColorStop(0.16, color); g.addColorStop(0.42, `${color}88`); g.addColorStop(1, `${color}00`); }
  c.fillStyle = g; c.fillRect(0, 0, 48, 48);
  sprites.set(key, s);
  return s;
}

export function particles(host: HTMLElement) {
  // the ground's weather drifts behind everything; sparks and ink fly in front
  const make = (cls: string) => { const c = document.createElement('canvas'); c.className = cls; c.setAttribute('aria-hidden', 'true'); host.appendChild(c); return c; };
  const canvas = make('fx-canvas'), backCanvas = make('fx-canvas back');
  const ctx = canvas.getContext('2d'), bctx = backCanvas.getContext('2d');
  let ps: P[] = [], raf = 0, last = 0, weather: Weather | null = null, weatherClock = 0, dpr = 1, w = 0, h = 0;

  const size = () => {
    const r = host.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1); w = r.width; h = r.height;
    for (const c of [canvas, backCanvas]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  };
  size();
  const onResize = () => size();
  addEventListener('resize', onResize);

  function add(p: Partial<P> & { x: number; y: number; color: string }) {
    ps.push({ vx: 0, vy: 0, life: 0, max: 1, size: 6, shape: 'dot', g: 0, drag: 0.9, grow: 0, ...p });
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  function burst(o: BurstOpts) {
    if (still() || !ctx) return;
    const n = o.count ?? 18, sp = o.speed ?? 220, spread = o.spread ?? Math.PI * 2, base = o.angle ?? -Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const a = base + (Math.random() - 0.5) * spread, v = sp * (0.35 + Math.random() * 0.75);
      add({
        x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, color: o.color,
        max: (o.life ?? 0.7) * (0.6 + Math.random() * 0.6), size: (o.size ?? 7) * (0.6 + Math.random() * 0.8),
        shape: o.shape ?? 'spark', g: o.gravity ?? 260, drag: o.drag ?? 0.9,
      });
    }
  }

  function ring(x: number, y: number, color: string, radius = 60) {
    if (still() || !ctx) return;
    add({ x, y, color, shape: 'ring', max: 0.5, size: 8, grow: radius, drag: 1 });
  }

  /* Points along a path, for a card's trail. */
  function trail(x: number, y: number, color: string) {
    if (still() || !ctx) return;
    for (let i = 0; i < 2; i++) add({ x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, color, size: 5 + Math.random() * 5, max: 0.45 + Math.random() * 0.25, shape: 'dot', drag: 0.95 });
  }

  function setWeather(kind: Weather | null) {
    weather = still() ? null : kind;
    if (weather && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  function spawnWeather(dt: number) {
    if (!weather) return;
    weatherClock += dt;
    const every = weather === 'air' ? 0.5 : weather === 'earth' ? 0.42 : 0.3;
    while (weatherClock > every) {
      weatherClock -= every;
      const x = Math.random() * w, y = h * (0.62 + Math.random() * 0.36);
      if (weather === 'fire') add({ back: true, x, y, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 40, color: '#ff8a3c', size: 3 + Math.random() * 4, max: 2.4 + Math.random() * 1.6, shape: 'dot', drag: 0.99, g: -4 });
      else if (weather === 'earth') add({ back: true, x, y, vx: 6 + Math.random() * 10, vy: -4 - Math.random() * 6, color: '#b58a4a', size: 4 + Math.random() * 4, max: 3.5 + Math.random() * 2, shape: 'dot', drag: 0.995 });
      else if (weather === 'air') add({ back: true, x: -40, y: h * (0.25 + Math.random() * 0.6), vx: 120 + Math.random() * 80, vy: (Math.random() - 0.5) * 8, color: '#bcd9ff', size: 26 + Math.random() * 30, max: 4 + Math.random() * 2, shape: 'spark', drag: 1 });
      else add({ back: true, x, y, vx: (Math.random() - 0.5) * 8, vy: -8 - Math.random() * 10, color: '#4fb8b0', size: 2 + Math.random() * 3, max: 3 + Math.random() * 2, shape: 'ring', drag: 0.995, grow: 3 });
    }
  }

  function tick(now: number) {
    const ctx0 = ctx;
    if (!ctx0) return;
    if (!canvas.isConnected) { stop(); return; } // the fight screen was replaced
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!document.hidden) spawnWeather(dt);
    for (const c of [ctx, bctx]) { if (!c) continue; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h); }
    const keep: P[] = [];
    for (const p of ps) {
      const ctx = p.back && bctx ? bctx : ctx0;
      p.life += dt;
      if (p.life >= p.max) continue;
      const k = Math.pow(p.drag, dt * 60);
      p.vx *= k; p.vy = p.vy * k + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const t = p.life / p.max, fade = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      ctx.globalAlpha = Math.max(0, fade) * (p.back ? 0.75 : 1);
      if (p.shape === 'ring') {
        const r = p.size + p.grow * t;
        ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, 4 * (1 - t));
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
      } else if (p.shape === 'spark') {
        // a short streak along its direction
        const sp = Math.hypot(p.vx, p.vy) || 1, len = Math.min(p.size * 3.5, sp * 0.06 + p.size);
        ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, p.size * 0.42); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (p.vx / sp) * len, p.y - (p.vy / sp) * len); ctx.stroke();
        const s = sprite(p.color), d = p.size * 2.2;
        ctx.drawImage(s, p.x - d / 2, p.y - d / 2, d, d);
      } else {
        const s = sprite(p.color, p.shape === 'ink'), d = p.size * (p.shape === 'ink' ? 2.6 + t * 1.5 : 2.4);
        ctx.drawImage(s, p.x - d / 2, p.y - d / 2, d, d);
      }
      keep.push(p);
    }
    ctx0.globalAlpha = 1; if (bctx) bctx.globalAlpha = 1;
    ps = keep;
    raf = ps.length || weather ? requestAnimationFrame(tick) : 0;
  }

  const onVis = () => { if (!document.hidden && (ps.length || weather) && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  document.addEventListener('visibilitychange', onVis);

  function stop() {
    cancelAnimationFrame(raf); raf = 0; ps = []; weather = null;
    removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    canvas.remove(); backCanvas.remove();
  }
  return { burst, ring, trail, setWeather, stop, add };
}
