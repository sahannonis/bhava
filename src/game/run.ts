/* A run: the twelve houses walked in order, each a short chapter of steps.
   One planet: lesser fight, story, the planet. Two or more: lesser, story, lesser, the conjunction.
   Empty: story, rest. The 12th always ends at the final gate. */
import type { Reading } from '../seed';
import { rngFor } from '../rng';
import { LESSER, PLANET_ENEMIES, conjunction, gateShade, scaled, type EnemyDef } from './enemies';
import { starterDeck } from './cards';

export type StepKind = 'lesser' | 'story' | 'planet' | 'boss' | 'rest' | 'gate';
export type Step = { kind: StepKind; house: number; enemy?: EnemyDef };

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
  pressing: string;    // today's pressing planet when the run began: its enemies hit 1 harder
  over?: 'won' | 'lost';
};

export const PRANA: Record<string, number> = { lesser: 8, planet: 15, boss: 25, gate: 30 };

const strongest = (s: string[]) => (s.includes('strong') ? 'strong' : s.every(x => x === 'weak') ? 'weak' : 'normal') as 'strong' | 'normal' | 'weak';

export function houseSteps(r: Reading, run: RunState, n: number): Step[] {
  const h = r.houses[n - 1];
  const rng = rngFor(r.seed, run.run * 1000 + n);
  const lesser = () => scaled(rng.pick(LESSER[h.element]), n);
  const pressing = (p: string) => p === run.pressing;
  let steps: Step[];
  if (h.planets.length === 0) {
    steps = n === 12
      ? [{ kind: 'story', house: n }, { kind: 'gate', house: n, enemy: scaled(gateShade(r.cls.ruler), n, { pressing: pressing(r.cls.ruler) }) }]
      : [{ kind: 'story', house: n }, { kind: 'rest', house: n }];
  } else if (h.planets.length === 1) {
    const p = h.planets[0];
    steps = [{ kind: 'lesser', house: n, enemy: lesser() }, { kind: 'story', house: n },
      { kind: n === 12 ? 'gate' : 'planet', house: n, enemy: scaled(PLANET_ENEMIES[p.name], n, { strength: p.strength, pressing: pressing(p.name) }) }];
  } else {
    const names = h.planets.map(p => p.name);
    const boss = scaled(conjunction(names), n, { strength: strongest(h.planets.map(p => p.strength)), pressing: names.some(pressing) });
    steps = [{ kind: 'lesser', house: n, enemy: lesser() }, { kind: 'story', house: n }, { kind: 'lesser', house: n, enemy: lesser() },
      { kind: n === 12 ? 'gate' : 'boss', house: n, enemy: boss }];
  }
  return steps;
}

export function newRun(r: Reading, runNo: number, opts: { maxHpBonus?: number; pressing: string }): RunState {
  const maxHp = 60 + (r.cls.ruler === 'Sun' ? 8 : 0) + (opts.maxHpBonus ?? 0);
  return { v: 1, run: runNo, house: 1, step: 0, hp: maxHp, maxHp, deck: starterDeck(r.cls.ruler), prana: 0, fights: 0, cleared: [], pressing: opts.pressing };
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
