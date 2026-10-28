/* The opening, after the phone's launch screen: the leaf dims, a lamp is struck, its light spreads,
   the chart of twelve houses draws itself in gold around the flame, a star lights in each house,
   and the name rises. A tap skips it. The first time it plays in full; after that it is quicker.
   With reduced motion on it is skipped. The app is built underneath while it plays. */
import { LINES } from './chartSvg';
import { sfx } from './sound';

const HOUSE_MIDS: [number, number][] = [[200, 100], [100, 34], [34, 100], [100, 200], [34, 300], [100, 366], [200, 300], [300, 366], [366, 300], [300, 200], [366, 100], [300, 34]];
const SEEN = 'bhava.opened';

export function playOpening(): Promise<void> {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  let seen = false;
  try { seen = localStorage.getItem(SEEN) === '1'; localStorage.setItem(SEEN, '1'); } catch { /* fine */ }
  const k = seen ? 0.62 : 1; // later openings run at about two thirds of the time

  const el = document.createElement('div');
  el.id = 'opening';
  el.className = 'opening-screen';
  el.style.setProperty('--k', String(k));
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Bhava: The Twelve Houses');
  el.innerHTML = `
    <div class="op-dark"></div>
    <div class="op-light"></div>
    <div class="op-stage">
      <svg class="op-chart" viewBox="-12 -12 424 424" aria-hidden="true">
        <path class="op-lines-glow" d="${LINES}" pathLength="1" />
        <path class="op-lines" d="${LINES}" pathLength="1" />
        <g class="op-stars">${HOUSE_MIDS.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4.2" style="--i:${i}" />`).join('')}</g>
      </svg>
      <svg class="op-lamp" viewBox="0 0 32 32" aria-hidden="true">
        <ellipse class="op-halo" cx="16" cy="11" rx="11" ry="11" />
        <path class="op-flame" d="M16 4 C18 8 20 10 20 13 A4 4 0 0 1 12 13 C12 10 14 8 16 4 Z" />
        <path class="op-bowl" d="M4 19 H28 C27 25 22 28 16 28 C10 28 5 25 4 19 Z" />
        <path class="op-lip" d="M26 19 L30 16" />
      </svg>
    </div>
    <div class="op-title"><h1>Bhava</h1><p>The Twelve Houses</p></div>`;
  document.body.appendChild(el);

  const soundAt = setTimeout(() => sfx('open'), 520 * k);
  return new Promise(resolve => {
    let gone = false;
    const leave = (fast: boolean) => {
      if (gone) return;
      gone = true;
      clearTimeout(timer);
      if (fast) clearTimeout(soundAt);
      el.classList.add('leaving');
      if (fast) el.classList.add('fast');
      setTimeout(() => { el.remove(); resolve(); }, fast ? 320 : 650);
    };
    const timer = setTimeout(() => leave(false), 3700 * k);
    el.addEventListener('pointerdown', () => leave(true), { once: true });
  });
}
