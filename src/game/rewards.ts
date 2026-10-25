/* Card picks after fights, and what a rest place sells. Drawn from the house's planets,
   your class's planet and the rest of the sky, so your deck leans toward your own chart. */
import { BASE_IDS, CARDS, CLASS_CARDS } from './cards';
import type { Rng } from '../rng';

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const pool = () => BASE_IDS().filter(id => id !== 'strike' && id !== 'guard');
const ofPlanet = (p: string) => pool().filter(id => CARDS[id].planet === p);

/* Three (or more) different cards: one from a planet of this house, one from your class, the rest from anywhere. */
export function cardChoices(rng: Rng, opts: { housePlanets: string[]; cls: string; count?: number }): string[] {
  const out: string[] = [];
  const add = (list: string[]) => {
    const left = list.filter(id => !out.includes(id));
    if (left.length) out.push(rng.pick(left));
  };
  if (opts.housePlanets.length) add(opts.housePlanets.flatMap(ofPlanet));
  add(ofPlanet(opts.cls).concat(CLASS_CARDS[opts.cls] ?? []).filter(id => id !== 'strike' && id !== 'guard'));
  while (out.length < (opts.count ?? 3)) add(rng.pick([pool(), ofPlanet(rng.pick(PLANETS))]));
  return out;
}

export const SKIP_PRANA = 5;

export function price(id: string, discount = 0): number {
  const base = CARDS[id].cost >= 2 ? 40 : 30;
  return Math.round(base * (1 - discount));
}
export const CUT_PRICE = 30;
export const SHARPEN_PRICE = 40; // the keeper raises one card a level
