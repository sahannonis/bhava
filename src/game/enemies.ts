/* Enemies and their moves: the nine planets, two lesser spirits for each element, the practice shade,
   and builders for bosses (planets in conjunction) and the final gate. Numbers are first drafts. */
import type { StatusId } from './cards';

export type EnemyAction =
  | { kind: 'attack'; amount: number; times?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'status'; to: 'self' | 'player'; status: StatusId; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'cleanse' };

export type Move = { name: string; actions: EnemyAction[] };

export type EnemyDef = {
  id: string;
  name: string;
  planet?: string;   // a planet enemy, or the planet a boss or shade belongs to first
  planets?: string[]; // every planet in a boss
  element?: string;  // a lesser spirit's element
  hp: number;
  moves: Move[];
  order: 'cycle' | 'random'; // cycle: in order from a seeded start; random: seeded, never the same move three times running
  might?: number;    // starts the fight with this much might
  rank: 'lesser' | 'planet' | 'boss' | 'gate' | 'practice';
};

const atk = (amount: number, times?: number): EnemyAction => ({ kind: 'attack', amount, ...(times ? { times } : {}) });
const blk = (amount: number): EnemyAction => ({ kind: 'block', amount });
const give = (status: StatusId, amount: number): EnemyAction => ({ kind: 'status', to: 'player', status, amount });
const gain = (status: StatusId, amount: number): EnemyAction => ({ kind: 'status', to: 'self', status, amount });
const heal = (amount: number): EnemyAction => ({ kind: 'heal', amount });

/* ---------- the nine planets ---------- */
export const PLANET_ENEMIES: Record<string, EnemyDef> = {
  Sun: { id: 'sun', name: 'The Pale King', planet: 'Sun', hp: 48, order: 'cycle', rank: 'planet', moves: [
    { name: 'Scorching gaze', actions: [atk(8)] },
    { name: 'Royal decree', actions: [gain('might', 2), blk(6)] },
    { name: 'Flare', actions: [atk(5), give('burn', 3)] },
  ] },
  Moon: { id: 'moon', name: 'The Tide Mother', planet: 'Moon', hp: 46, order: 'random', rank: 'planet', moves: [
    { name: 'Flood', actions: [atk(4, 2)] },
    { name: 'Lull', actions: [give('weak', 2), blk(5)] },
    { name: 'Ebb', actions: [heal(6), blk(6)] },
    { name: 'Rising tide', actions: [atk(10)] },
  ] },
  Mars: { id: 'mars', name: 'The Red Spear', planet: 'Mars', hp: 44, order: 'cycle', rank: 'planet', moves: [
    { name: 'Thrust', actions: [atk(10)] },
    { name: 'Pierce', actions: [atk(6), give('exposed', 2)] },
    { name: 'Battle rage', actions: [gain('might', 3)] },
    { name: 'Frenzy', actions: [atk(3, 3)] },
  ] },
  Mercury: { id: 'mercury', name: 'The Twin Tongue', planet: 'Mercury', hp: 42, order: 'random', rank: 'planet', moves: [
    { name: 'Twin jab', actions: [atk(3, 2), give('weak', 1)] },
    { name: 'Mockery', actions: [give('weak', 2), give('exposed', 1)] },
    { name: 'Quick cut', actions: [atk(8)] },
    { name: 'Slip away', actions: [blk(10)] },
  ] },
  Jupiter: { id: 'jupiter', name: 'The Hollow Teacher', planet: 'Jupiter', hp: 56, order: 'cycle', rank: 'planet', moves: [
    { name: 'Lecture', actions: [blk(12)] },
    { name: 'Heavy hand', actions: [atk(12)] },
    { name: 'Sermon', actions: [gain('might', 2), heal(5)] },
    { name: 'Weight of rules', actions: [atk(7), give('weak', 2)] },
  ] },
  Venus: { id: 'venus', name: 'The Silk Veil', planet: 'Venus', hp: 44, order: 'random', rank: 'planet', moves: [
    { name: 'Allure', actions: [give('weak', 2), give('exposed', 2)] },
    { name: 'Silk cut', actions: [atk(7)] },
    { name: 'Embrace', actions: [heal(8), blk(5)] },
    { name: 'Thorned kiss', actions: [atk(9)] },
  ] },
  Saturn: { id: 'saturn', name: 'The Grey Warden', planet: 'Saturn', hp: 60, order: 'cycle', rank: 'planet', moves: [
    { name: 'Wall', actions: [blk(14)] },
    { name: 'Grind', actions: [atk(4), give('weak', 1)] },
    { name: 'Weight of years', actions: [give('exposed', 2), give('weak', 1)] },
    { name: 'Slow hammer', actions: [atk(15)] },
  ] },
  Rahu: { id: 'rahu', name: 'The Hungry Head', planet: 'Rahu', hp: 50, order: 'random', rank: 'planet', moves: [
    { name: 'Devour', actions: [atk(8), heal(4)] },
    { name: 'Crave', actions: [gain('might', 2)] },
    { name: 'Smoke', actions: [atk(5), give('burn', 2)] },
    { name: 'Swallow', actions: [atk(3, 3)] },
  ] },
  Ketu: { id: 'ketu', name: 'The Headless One', planet: 'Ketu', hp: 46, order: 'cycle', rank: 'planet', moves: [
    { name: 'Headless swing', actions: [atk(11)] },
    { name: 'Let go', actions: [{ kind: 'cleanse' }, blk(10)] },
    { name: 'Phantom', actions: [give('exposed', 3)] },
    { name: 'Cut ties', actions: [atk(4, 2)] },
  ] },
};

/* ---------- two lesser spirits for each element, the house's own ---------- */
export const LESSER: Record<string, EnemyDef[]> = {
  fire: [
    { id: 'emberImp', name: 'Ember Imp', element: 'fire', hp: 24, order: 'cycle', rank: 'lesser', moves: [{ name: 'Spark', actions: [atk(5)] }, { name: 'Singe', actions: [atk(2), give('burn', 2)] }] },
    { id: 'ashWisp', name: 'Ash Wisp', element: 'fire', hp: 22, order: 'cycle', rank: 'lesser', moves: [{ name: 'Flicker', actions: [atk(3, 2)] }, { name: 'Kindle', actions: [gain('might', 1), blk(3)] }] },
  ],
  earth: [
    { id: 'clayHulk', name: 'Clay Hulk', element: 'earth', hp: 30, order: 'cycle', rank: 'lesser', moves: [{ name: 'Settle', actions: [blk(8)] }, { name: 'Crush', actions: [atk(9)] }] },
    { id: 'rootCrawler', name: 'Root Crawler', element: 'earth', hp: 26, order: 'cycle', rank: 'lesser', moves: [{ name: 'Snare', actions: [atk(4), give('weak', 1)] }, { name: 'Lash', actions: [atk(6)] }] },
  ],
  air: [
    { id: 'windShade', name: 'Wind Shade', element: 'air', hp: 22, order: 'cycle', rank: 'lesser', moves: [{ name: 'Gust', actions: [atk(2, 3)] }, { name: 'Drift', actions: [blk(5)] }] },
    { id: 'dustDevil', name: 'Dust Devil', element: 'air', hp: 24, order: 'cycle', rank: 'lesser', moves: [{ name: 'Blind', actions: [give('exposed', 2)] }, { name: 'Whirl', actions: [atk(7)] }] },
  ],
  water: [
    { id: 'mireSpirit', name: 'Mire Spirit', element: 'water', hp: 26, order: 'cycle', rank: 'lesser', moves: [{ name: 'Sink', actions: [give('weak', 2)] }, { name: 'Drag', actions: [atk(6)] }] },
    { id: 'undertow', name: 'Undertow', element: 'water', hp: 24, order: 'cycle', rank: 'lesser', moves: [{ name: 'Pull', actions: [atk(4, 2)] }, { name: 'Recede', actions: [heal(4), blk(3)] }] },
  ],
};

export const PRACTICE: EnemyDef = {
  id: 'shade', name: 'Practice Shade', hp: 42, order: 'cycle', rank: 'practice',
  moves: [
    { name: 'Cut', actions: [atk(7)] },
    { name: 'Hunch', actions: [blk(6), atk(4)] },
    { name: 'Twin cut', actions: [atk(4, 2)] },
    { name: 'Gather', actions: [gain('might', 2)] },
  ],
};

/* Every enemy by id, for fights that name them. */
export const ENEMY_DEFS: Record<string, EnemyDef> = Object.fromEntries([
  PRACTICE, ...Object.values(PLANET_ENEMIES), ...Object.values(LESSER).flat(),
].map(d => [d.id, d]));

/* ---------- making an enemy for a place in the run ---------- */

/* Deeper houses are harder: more health, and harder hits every third house. */
export function scaled(def: EnemyDef, house: number, opts: { strength?: 'strong' | 'normal' | 'weak'; pressing?: boolean } = {}): EnemyDef {
  // bosses in the first three houses are a little gentler, so a crowded 1st house isn't a wall
  const early = def.rank === 'boss' && house <= 3 ? 0.85 : 1;
  const hpMult = (1 + 0.1 * (house - 1)) * (opts.strength === 'strong' ? 1.2 : opts.strength === 'weak' ? 0.85 : 1) * early;
  const plus = Math.floor((house - 1) / 2) + (opts.strength === 'strong' ? 1 : 0);
  const moves = def.moves.map(m => ({
    name: m.name,
    actions: m.actions.map(a => (a.kind === 'attack' ? { ...a, amount: a.amount + plus } : a.kind === 'block' ? { ...a, amount: a.amount + plus } : a)),
  }));
  return { ...def, hp: Math.round(def.hp * hpMult), moves, might: (def.might ?? 0) + (opts.pressing ? 1 : 0) };
}

/* Two or more planets in one house fight as one: a conjunction, with all their moves. */
export function conjunction(planets: string[]): EnemyDef {
  const parts = planets.map(p => PLANET_ENEMIES[p]);
  const moves: Move[] = [];
  // take turns: first move of each planet, then the second of each, and so on
  for (let i = 0; i < 4; i++) for (const d of parts) if (d.moves[i]) moves.push({ ...d.moves[i], name: `${d.planet}: ${d.moves[i].name}` });
  // the planets' average health, plus 30% for each planet beyond the first
  const hp = Math.round((parts.reduce((n, d) => n + d.hp, 0) / parts.length) * (1 + 0.3 * (planets.length - 1)));
  return {
    id: `conj-${planets.join('-').toLowerCase()}`,
    name: `The ${planets.join('–')} Conjunction`,
    planet: planets[0], planets, hp, moves, order: 'cycle', rank: 'boss',
  };
}

/* An empty 12th house is held by a shade of the player's own lagna lord. */
export function gateShade(lagnaLord: string): EnemyDef {
  const d = PLANET_ENEMIES[lagnaLord];
  return { ...d, id: `gate-${d.id}`, name: `Shade of ${d.name.replace(/^The /, 'the ')}`, hp: Math.round(d.hp * 1.25), rank: 'gate', might: 1 };
}
