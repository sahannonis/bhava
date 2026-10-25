/* Yogas: when cards of two planets are played in the same turn, they join, the way planets
   that meet in a chart form a yoga. Each fires once per turn. The names are the real ones;
   what they do in the game is drawn from what each yoga is known for. */

export type YogaEffect =
  | { kind: 'draw'; n: number }
  | { kind: 'block'; amount: number }
  | { kind: 'breath'; n: number }
  | { kind: 'damage'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'status'; to: 'target' | 'self'; status: 'weak' | 'exposed' | 'might' | 'burn'; amount: number }
  | { kind: 'loseHp'; amount: number };

export type Yoga = { id: string; name: string; planets: [string, string | string[]]; meaning: string; effects: YogaEffect[] };

export const YOGAS: Yoga[] = [
  { id: 'budhaditya', name: 'Budhaditya Yoga', planets: ['Sun', 'Mercury'], meaning: 'The Sun lights the mind: sharp thinking.', effects: [{ kind: 'draw', n: 2 }] },
  { id: 'gajakesari', name: 'Gajakesari Yoga', planets: ['Moon', 'Jupiter'], meaning: 'The elephant and the lion: lasting protection.', effects: [{ kind: 'block', amount: 8 }] },
  { id: 'chandraMangala', name: 'Chandra-Mangala Yoga', planets: ['Moon', 'Mars'], meaning: 'Feeling joined to drive: a second wind.', effects: [{ kind: 'breath', n: 1 }] },
  { id: 'guruMangala', name: 'Guru-Mangala Yoga', planets: ['Jupiter', 'Mars'], meaning: 'Wisdom guiding courage: a righteous blow.', effects: [{ kind: 'damage', amount: 8 }] },
  { id: 'lakshmiNarayana', name: 'Lakshmi-Narayana Yoga', planets: ['Venus', 'Mercury'], meaning: 'Grace and skill together: things mend.', effects: [{ kind: 'heal', amount: 5 }] },
  { id: 'shukraShani', name: 'Shukra-Shani Yoga', planets: ['Venus', 'Saturn'], meaning: 'Beauty that lasts: patient strength.', effects: [{ kind: 'status', to: 'self', status: 'might', amount: 1 }, { kind: 'block', amount: 4 }] },
  { id: 'surya-shani', name: 'Pitri Dosha', planets: ['Sun', 'Saturn'], meaning: 'Father and son at odds: a heavy, costly strike.', effects: [{ kind: 'loseHp', amount: 2 }, { kind: 'damage', amount: 12 }] },
  { id: 'grahan', name: 'Grahan Yoga', planets: ['Rahu', ['Sun', 'Moon']], meaning: 'An eclipse: the light is swallowed, for both sides.', effects: [{ kind: 'loseHp', amount: 3 }, { kind: 'status', to: 'target', status: 'exposed', amount: 2 }, { kind: 'status', to: 'target', status: 'weak', amount: 2 }] },
  { id: 'ketuMoksha', name: 'Moksha Yoga', planets: ['Ketu', 'Jupiter'], meaning: 'Release under a teacher: letting go heals.', effects: [{ kind: 'heal', amount: 6 }] },
];

const has = (set: Set<string>, p: string | string[]) => (Array.isArray(p) ? p.some(x => set.has(x)) : set.has(p));

/* The yogas that a newly played planet completes with the planets already played this turn. */
export function yogasFormed(before: Set<string>, planet: string, done: Set<string>): Yoga[] {
  const now = new Set(before); now.add(planet);
  return YOGAS.filter(y => !done.has(y.id)
    && has(now, y.planets[0]) && has(now, y.planets[1])
    && (y.planets[0] === planet || (Array.isArray(y.planets[1]) ? y.planets[1].includes(planet) : y.planets[1] === planet)));
}

export const yogaText = (y: Yoga) => {
  const two = Array.isArray(y.planets[1]) ? `${y.planets[0]} with the ${y.planets[1].join(' or ')}` : `${y.planets[0]} and ${y.planets[1]}`;
  return `${two}: ${y.meaning}`;
};
