// npm test (runs with tsx)
import test from 'node:test';
import assert from 'node:assert';
import { newMeta, buy, perks, runKarma, endOfRun, lifeRules, highestLife, chosenLife, recordDaily, streakNow, triesLeft, dailyReward, UPGRADES } from '../src/game/meta';
import { newRun, houseSteps } from '../src/game/run';
import { startCombat, playCard } from '../src/game/combat';
import { PLANET_ENEMIES } from '../src/game/enemies';
import { fakeReading, summary } from './sim';

test('karma: a win keeps it all, a fall keeps half, later lives give more', () => {
  const won = runKarma({ cleared: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], story: 10, won: true, life: 1 });
  assert.equal(won.total, 78 + 10 + 20);
  const lost = runKarma({ cleared: [1, 2, 3, 4], story: 3, won: false, life: 1 });
  assert.equal(lost.total, 6); // 13 halved, the loss rounded up
  const life3 = runKarma({ cleared: [1, 2, 3, 4], story: 3, won: false, life: 3 });
  assert.ok(life3.total > lost.total);
  assert.equal(runKarma({ cleared: [], story: -5, won: false, life: 1 }).total, 0, 'never below zero');
});

test('the hub: upgrades cost karma, stop at their top level, and shape a new run', () => {
  const m = newMeta(); m.karma = 1000;
  for (const u of UPGRADES) for (let i = 0; i < 5; i++) buy(m, u.id);
  assert.equal(m.karma, 1000 - UPGRADES.reduce((a, u) => a + u.costs.reduce((x, y) => x + y, 0), 0));
  assert.ok(!buy({ ...newMeta(), karma: 5 }, 'eye'), 'too poor');
  const r = fakeReading(3), plain = newRun(r, 1, { pressing: 'Moon' }), rich = newRun(r, 1, { pressing: 'Moon', perks: perks(m) });
  assert.equal(rich.maxHp, plain.maxHp + 15);
  assert.equal(rich.prana, 45);
  assert.equal(rich.deck.length, plain.deck.length - 1, 'one Strike fewer');
  assert.ok(rich.deck.some(c => c.endsWith('+')), 'signature card at level 2');
  assert.equal(rich.perks!.extraChoice, 1);
});

test('lives: a win opens the next, each life adds its rules, the 12th is the last', () => {
  const m = newMeta();
  assert.equal(highestLife(m, 7), 1);
  assert.deepEqual(endOfRun(m, 7, 50, true, 1), { newLife: 2 });
  assert.equal(chosenLife(m, 7), 2);
  assert.deepEqual(endOfRun(m, 7, 0, false, 2), { newLife: null });
  m.lives[7] = 12; assert.deepEqual(endOfRun(m, 7, 0, true, 12), { newLife: null });
  const r = fakeReading(11);
  const base = houseSteps(r, newRun(r, 1, { pressing: 'Moon', life: 1 }), 6);
  const hard = houseSteps(r, newRun(r, 1, { pressing: 'Moon', life: 12 }), 6);
  const lesser = (s: typeof base) => s.find(x => x.kind === 'lesser')!.enemies![0];
  assert.ok(lesser(hard).hp > lesser(base).hp);
  assert.equal(lesser(hard).block, 5);
  assert.ok(newRun(r, 1, { pressing: 'Moon', life: 7 }).maxHp < newRun(r, 1, { pressing: 'Moon', life: 1 }).maxHp);
  assert.equal(lifeRules(1).enrageAt, 0.5); assert.equal(lifeRules(5).enrageAt, 0.6);
});

test('a later life: enemies start with block and enrage sooner', () => {
  const def = { ...PLANET_ENEMIES.Mars, block: 5, enrageAt: 0.6 };
  const { state } = startCombat({ deck: Array(10).fill('strike'), enemies: [def], ground: 'earth', seed: 5, run: 1, hp: 60, maxHp: 60, mods: {} });
  assert.equal(state.enemies[0].block, 5);
  state.enemies[0].block = 0;
  state.enemies[0].hp = Math.floor(state.enemies[0].maxHp * 0.6) + 4;
  assert.ok(playCard(state, 0, 0).some(e => e.t === 'enrage'));
});

test('daily trial: one try a day, a streak that grows, and halves on missed days', () => {
  const m = newMeta();
  assert.equal(triesLeft(m, '2026-11-01'), 1);
  let out = recordDaily(m, '2026-11-01', true);
  assert.deepEqual(out, { streak: 1, karma: dailyReward(1) });
  assert.equal(triesLeft(m, '2026-11-01'), 0);
  assert.equal(recordDaily(m, '2026-11-01', true).karma, 0, 'karma once a day');
  recordDaily(m, '2026-11-02', false); recordDaily(m, '2026-11-03', false); recordDaily(m, '2026-11-04', false);
  assert.equal(m.daily.streak, 4);
  assert.equal(streakNow(m, '2026-11-05'), 4, 'still lit the next day');
  assert.equal(streakNow(m, '2026-11-06'), 2, 'one missed day halves it');
  out = recordDaily(m, '2026-11-06', true);
  assert.equal(out.streak, 3);
  assert.equal(m.daily.best, 4);
});

test('the first life is as hard as before the hub existed', () => {
  const s = summary('steady', 40);
  assert.ok(s.wins < 0.4 && s.avg > 6);
});
