// npm test (runs with tsx)
import test from 'node:test';
import assert from 'node:assert';
import { houseSteps, newRun, advance, currentStep, type RunState } from '../src/game/run';
import { startCombat, playCard, endTurn, intentOf, cantPlay, type CombatState } from '../src/game/combat';
import { PLANET_ENEMIES, LESSER, conjunction, scaled } from '../src/game/enemies';
import { rngFor } from '../src/rng';
import type { Reading } from '../src/seed';

const SIGN_EL = ['fire', 'earth', 'air', 'water'];
const LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

/* A made-up chart: planets dropped into random houses (Ketu always opposite Rahu). */
function fakeReading(seed: number): Reading {
  const rng = rngFor(seed, 0), lagna = rng.int(0, 11);
  const where: Record<string, number> = {};
  for (const p of PLANETS) where[p] = rng.int(1, 12);
  where.Ketu = ((where.Rahu + 5) % 12) + 1;
  const houses = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1, sign = (lagna + i) % 12;
    const planets = PLANETS.filter(p => where[p] === n).map(name => ({ name, dignity: '', strength: rng.pick(['strong', 'normal', 'weak'] as const), retro: false }));
    return { n, sign, signName: String(sign), element: SIGN_EL[sign % 4], lord: LORD[sign], lordHouse: 1, planets,
      kind: n === 12 ? 'gate' : planets.length >= 2 ? 'boss' : planets.length === 1 ? 'fight' : 'rest' } as Reading['houses'][number];
  });
  return { seed, houses, cls: { ruler: LORD[lagna], name: '', style: '' }, lagnaSign: lagna } as unknown as Reading;
}

test('every house has a chapter, and the 12th always ends at the final gate', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const r = fakeReading(seed), run = newRun(r, 1, { pressing: 'Saturn' });
    for (let n = 1; n <= 12; n++) {
      const steps = houseSteps(r, run, n), h = r.houses[n - 1];
      assert.ok(steps.length >= 2 && steps.length <= 4, `house ${n}`);
      if (n === 12) assert.equal(steps.at(-1)!.kind, 'gate');
      else if (h.planets.length === 0) assert.deepEqual(steps.map(s => s.kind), ['story', 'rest']);
      else if (h.planets.length === 1) assert.deepEqual(steps.map(s => s.kind), ['lesser', 'story', 'planet']);
      else assert.deepEqual(steps.map(s => s.kind), ['lesser', 'story', 'lesser', 'boss']);
      for (const s of steps) if (s.kind !== 'story' && s.kind !== 'rest') assert.ok(s.enemy && s.enemy.hp > 0 && s.enemy.moves.length > 0);
    }
  }
});

test('the same birth and run give the same chapters; a new run can change the lesser spirits', () => {
  const r = fakeReading(9);
  const a = newRun(r, 1, { pressing: 'Mars' }), b = newRun(r, 1, { pressing: 'Mars' }), c = newRun(r, 2, { pressing: 'Mars' });
  const names = (run: RunState) => Array.from({ length: 12 }, (_, i) => houseSteps(r, run, i + 1).map(s => s.enemy?.id ?? s.kind).join(',')).join('|');
  assert.equal(names(a), names(b));
  let differs = false;
  for (let s = 1; s <= 20 && !differs; s++) { const rr = fakeReading(s); differs = names(newRun(rr, 1, { pressing: 'Mars' })) !== names(newRun(rr, 7, { pressing: 'Mars' })); }
  assert.ok(differs);
  void c;
});

test('deeper houses are harder, strong planets are stronger, the pressing planet hits harder', () => {
  const sat = PLANET_ENEMIES.Saturn;
  assert.ok(scaled(sat, 10).hp > scaled(sat, 1).hp);
  assert.ok(scaled(sat, 1, { strength: 'strong' }).hp > scaled(sat, 1).hp);
  assert.ok(scaled(sat, 1, { strength: 'weak' }).hp < scaled(sat, 1).hp);
  assert.equal(scaled(sat, 1, { pressing: true }).might, 1);
  const boss = conjunction(['Sun', 'Moon', 'Mars']);
  assert.ok(boss.moves.length >= 9 && boss.name.includes('Conjunction'));
  assert.equal(Object.values(LESSER).flat().length, 8);
});

test('a run walks forward step by step and clears houses', () => {
  const r = fakeReading(3), run = newRun(r, 1, { pressing: 'Sun' });
  let cleared = 0, guard = 0;
  while (!run.over && guard++ < 100) {
    currentStep(r, run);
    if (advance(r, run).houseCleared) cleared++;
  }
  assert.equal(run.over, 'won');
  assert.equal(cleared, 12);
  assert.deepEqual(run.cleared, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

/* How far a plain bot gets with the starting deck alone, no rewards: a floor for balance. */
function bot(s: CombatState) {
  const prefer = ['quickWit', 'release', 'deepBreath', 'wisdom', 'moonlight', 'openWound', 'doubleTalk', 'kinglyBearing', 'ember', 'redRush', 'twinSpears',
    'slowToll', 'grind', 'noon', 'silkLash', 'feint', 'strike', 'weighDown', 'wane', 'sweetWords', 'charm', 'blessing', 'tidecall', 'gurusShield', 'guard'];
  for (let g = 0; g < 300 && s.phase === 'player'; g++) {
    let played = true;
    while (played && s.phase === 'player') {
      played = false;
      const foe = s.enemies.findIndex(e => e.hp > 0);
      const incoming = intentOf(s, foe).reduce((n, i) => n + (i.kind === 'attack' ? i.each * i.times : 0), 0);
      const order = incoming > s.player.block ? ['gurusShield', 'guard', 'blessing', 'tidecall', 'charm', 'sweetWords', 'weighDown', 'wane', ...prefer] : prefer;
      for (const id of order) {
        const i = s.hand.findIndex(c => c.id === id);
        if (i >= 0 && !cantPlay(s, i)) { playCard(s, i, foe); played = true; break; }
      }
    }
    if (s.phase === 'player') endTurn(s);
  }
}

test('balance floor: the starting deck alone gets a plain bot through the early houses', () => {
  const reached: number[] = [];
  for (let seed = 1; seed <= 40; seed++) {
    const r = fakeReading(seed), run = newRun(r, 1, { pressing: 'Saturn' });
    while (!run.over) {
      const st = currentStep(r, run);
      if (st.enemy) {
        const { state } = startCombat({ deck: run.deck, enemies: [st.enemy], ground: r.houses[run.house - 1].element as 'fire', seed, run: 1, fight: run.fights++, hp: run.hp, maxHp: run.maxHp, mods: { cls: r.cls.ruler } });
        bot(state);
        if (state.phase !== 'won') { run.over = 'lost'; break; }
        run.hp = state.player.hp;
      } else if (st.kind === 'rest') run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * 0.3));
      advance(r, run);
    }
    reached.push(run.over === 'won' ? 13 : run.house);
  }
  const avg = reached.reduce((a, b) => a + b, 0) / reached.length;
  console.log(`  starter deck only, no rewards: average house reached ${avg.toFixed(1)}; spread ${Math.min(...reached)}-${Math.max(...reached)}`);
  assert.ok(avg >= 3, `too hard early: ${avg}`);
});
