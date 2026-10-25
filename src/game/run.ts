/* A run: the twelve houses walked in order, each a short chapter of steps.
   One planet: lesser fight, story, the planet. Two or more: lesser, story, lesser, the conjunction.
   Empty: lesser, story, rest. The 12th always ends at the final gate.
   From the 5th house on, lesser spirits come in pairs. */
import type { Reading } from '../seed';
import { rngFor } from '../rng';
import { LESSER, PLANET_ENEMIES, conjunction, gateShade, scaled, type EnemyDef } from './enemies';
import { starterDeck } from './cards';

export type StepKind = 'lesser' | 'story' | 'planet' | 'boss' | 'rest' | 'gate';
export type Step = { kind: StepKind; house: number; enemies?: EnemyDef[] };

export type RunState = {
  v: 1;
  run: number;         // which run this is for this birth (seeds the randomness)
  house: number;       // 1..12, the house being walked
  step: number;        // index into that house's steps
  hp: number;
  maxHp: number;
  deck: string[];
  prana: number;
  fights: number;      // fights fought, for fresh shuffles
  cleared: number[];
  pressing: string;    // today's pressing planet when the run began: its enemies hit 1 harder (until its remedy)
  karma: number;       // moved by story choices and deeds; counted at the end of the run (Day 7)
  restGiftTaken?: boolean; // the rest place's arrival gift was given (so leaving and coming back doesn't repeat it)
  over?: 'won' | 'lost';
};

export const PAIRS_FROM = 5, PAIR_HP = 0.7;
export const PRANA: Record<string, number> = { lesser: 8, planet: 15, boss: 25, gate: 30 };

const strongest = (s: string[]) => (s.includes('strong') ? 'strong' : s.every(x => x === 'weak') ? 'weak' : 'normal') as 'strong' | 'normal' | 'weak';

export function houseSteps(r: Reading, run: RunState, n: number): Step[] {
  const h = r.houses[n - 1];
  const rng = rngFor(r.seed, run.run * 1000 + n);
  // one spirit early on; from the 5th house two together, each a little smaller
  const lesser = (): EnemyDef[] => {
    if (n < PAIRS_FROM) return [scaled(rng.pick(LESSER[h.element]), n)];
    const [a, b] = [rng.pick(LESSER[h.element]), rng.pick(LESSER[h.element])];
    return [a, b].map((d, i) => ({ ...scaled(d, n), hp: Math.round(scaled(d, n).hp * PAIR_HP), name: a.id === b.id ? `${d.name} ${i ? 'II' : 'I'}` : d.name }));
  };
  const pressing = (p: string) => p === run.pressing;
  let steps: Step[];
  if (h.planets.length === 0) {
    steps = n === 12
      ? [{ kind: 'lesser', house: n, enemies: lesser() }, { kind: 'story', house: n }, { kind: 'gate', house: n, enemies: [scaled(gateShade(r.cls.ruler), n, { pressing: pressing(r.cls.ruler) })] }]
      : [{ kind: 'lesser', house: n, enemies: lesser() }, { kind: 'story', house: n }, { kind: 'rest', house: n }];
  } else if (h.planets.length === 1) {
    const p = h.planets[0];
    steps = [{ kind: 'lesser', house: n, enemies: lesser() }, { kind: 'story', house: n },
      { kind: n === 12 ? 'gate' : 'planet', house: n, enemies: [scaled(PLANET_ENEMIES[p.name], n, { strength: p.strength, pressing: pressing(p.name) })] }];
  } else {
    const names = h.planets.map(p => p.name);
    const boss = scaled(conjunction(names), n, { strength: strongest(h.planets.map(p => p.strength)), pressing: names.some(pressing) });
    steps = [{ kind: 'lesser', house: n, enemies: lesser() }, { kind: 'story', house: n }, { kind: 'lesser', house: n, enemies: lesser() },
      { kind: n === 12 ? 'gate' : 'boss', house: n, enemies: [boss] }];
  }
  return steps;
}

export function newRun(r: Reading, runNo: number, opts: { maxHpBonus?: number; pressing: string }): RunState {
  const maxHp = 60 + (r.cls.ruler === 'Sun' ? 8 : 0) + (opts.maxHpBonus ?? 0);
  return { v: 1, run: runNo, house: 1, step: 0, hp: maxHp, maxHp, deck: starterDeck(r.cls.ruler), prana: 0, fights: 0, cleared: [], pressing: opts.pressing, karma: 0 };
}

export const currentStep = (r: Reading, run: RunState): Step => houseSteps(r, run, run.house)[run.step];

/* Move on after a step is done. Returns what just finished. */
export function advance(r: Reading, run: RunState): { houseCleared: boolean; runWon: boolean } {
  const steps = houseSteps(r, run, run.house);
  run.step += 1;
  if (run.step < steps.length) return { houseCleared: false, runWon: false };
  run.cleared.push(run.house);
  if (run.house === 12) { run.over = 'won'; return { houseCleared: true, runWon: true }; }
  run.house += 1;
  run.step = 0;
  return { houseCleared: true, runWon: false };
}

export const STEP_NAME: Record<StepKind, string> = { lesser: 'Lesser spirit', story: 'Story', planet: 'Planet', boss: 'Boss', rest: 'Rest place', gate: 'Final gate' };

/* ---------- changing the run ---------- */
import type { Outcome } from './stories';
import { baseId, canUpgrade } from './cards';
import type { Rng } from '../rng';

export function applyOutcome(run: RunState, o: Outcome, rng: Rng): string[] {
  const notes: string[] = [];
  run.karma += o.karma;
  if (o.maxHp) { run.maxHp += o.maxHp; run.hp += o.maxHp; notes.push(`+${o.maxHp} max health`); }
  if (o.hp) { const before = run.hp; run.hp = Math.max(1, Math.min(run.maxHp, run.hp + o.hp)); const d = run.hp - before; if (d) notes.push(`${d > 0 ? '+' : ''}${d} health`); }
  if (o.prana) { const before = run.prana; run.prana = Math.max(0, run.prana + o.prana); const d = run.prana - before; if (d) notes.push(`${d > 0 ? '+' : ''}${d} prana`); }
  if (o.addCard) { run.deck.push(o.addCard); notes.push(`a new card`); }
  if (o.removeCard) { const i = run.deck.findIndex(c => baseId(c) === o.removeCard); if (i >= 0) { run.deck.splice(i, 1); notes.push('one card set down'); } }
  if (o.upgrade) { const id = upgradeRandom(run, rng); if (id) notes.push(`${id} upgraded`); }
  return notes;
}

export function upgradeCard(run: RunState, index: number): void {
  if (canUpgrade(run.deck[index])) run.deck[index] += '+';
}

/* Upgrade one card that isn't upgraded yet; returns its base id. */
export function upgradeRandom(run: RunState, rng: Rng): string | null {
  const open = run.deck.map((c, i) => [c, i] as const).filter(([c]) => canUpgrade(c));
  if (!open.length) return null;
  const [id, i] = rng.pick(open);
  upgradeCard(run, i);
  return id;
}
