/* Today's sky: where the real Moon is today, counted from the player's lagna.
   Read at local noon so the effect holds for the whole day. */
import { E } from './engine';
import { MOON_DAY } from './content';
import type { Reading } from './seed';

export type MoonDay = { house: number; signName: string; dayKey: string; title: string; effect: string };

export function moonDay(r: Reading, now = new Date()): MoonDay {
  const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const moon = E.chart(noon.getTime(), 0, 0).by.Moon;
  const house = ((moon.sign - r.lagnaSign + 12) % 12) + 1;
  const dayKey = `${noon.getFullYear()}-${String(noon.getMonth() + 1).padStart(2, '0')}-${String(noon.getDate()).padStart(2, '0')}`;
  return { house, signName: E.SIGNS[moon.sign].en, dayKey, ...MOON_DAY[house - 1] };
}
