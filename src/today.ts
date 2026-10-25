/* Today's sky: where the real Moon is today, counted from the player's lagna.
   Read at local noon so the effect holds for the whole day. */
import { E } from './engine';
import { MOON_DAY } from './content';
import type { Reading } from './seed';

export type MoonDay = {
  house: number; signName: string; dayKey: string; title: string; effect: string;
  elong: number; // Moon's distance from the Sun in degrees: 0 new, 180 full
  lit: number;   // share of the Moon's face that is lit, 0 to 1
};

export function moonDay(r: Reading, now = new Date()): MoonDay {
  const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const sky = E.chart(noon.getTime(), 0, 0), moon = sky.by.Moon;
  const house = ((moon.sign - r.lagnaSign + 12) % 12) + 1;
  const dayKey = `${noon.getFullYear()}-${String(noon.getMonth() + 1).padStart(2, '0')}-${String(noon.getDate()).padStart(2, '0')}`;
  const elong = (sky as unknown as { elong: number }).elong;
  return { house, signName: E.SIGNS[moon.sign].en, dayKey, ...MOON_DAY[house - 1], elong, lit: (1 - Math.cos((elong * Math.PI) / 180)) / 2 };
}

/* Today's Moon as seen from the north: lit on the right while it grows, on the left as it shrinks. */
export function moonSvg(elong: number, r = 15): string {
  const c = Math.cos((elong * Math.PI) / 180), rx = Math.abs(c) * r;
  const lit = `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx.toFixed(2)},${r} 0 0 ${c > 0 ? 0 : 1} 0,${-r}Z`;
  const flip = elong > 180 ? ' transform="scale(-1,1)"' : '';
  const pad = r + 9, size = pad * 2;
  return `<svg class="moon" viewBox="${-pad} ${-pad} ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <defs><filter id="moon-blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" /></filter></defs>
    <circle class="moon-halo" r="${r + 1}" filter="url(#moon-blur)" />
    <circle class="moon-dark" r="${r}" />
    <path class="moon-lit" d="${lit}"${flip} />
    <circle class="moon-rim" r="${r}" />
  </svg>`;
}
