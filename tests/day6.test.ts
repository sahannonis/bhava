// npm test (runs with tsx)
import test from 'node:test';
import assert from 'node:assert';
import { CARDS, BASE_IDS, cardText } from '../src/game/cards';
import { cardChoices, price } from '../src/game/rewards';
import { STORIES } from '../src/game/stories';
import { applyOutcome, newRun, upgradeCard } from '../src/game/run';
import { rngFor } from '../src/rng';
import type { Reading } from '../src/seed';

const reading = { seed: 5, cls: { ruler: 'Jupiter' }, houses: [] } as unknown as Reading;

test('every card has an upgrade that is better or cheaper', () => {
  for (const id of BASE_IDS()) {
    const a = CARDS[id], b = CARDS[`${id}+`];
    assert.ok(b && b.name === a.name, id);
    assert.ok(b.cost < a.cost || cardText(b) !== cardText(a), `${id} does not improve`);
  }
});

test('card picks: three different cards, one from the house planets and one from the class', () => {
  for (let i = 0; i < 50; i++) {
    const ids = cardChoices(rngFor(9, i), { housePlanets: ['Saturn'], cls: 'Venus' });
    assert.equal(new Set(ids).size, 3);
    assert.equal(CARDS[ids[0]].planet, 'Saturn');
    assert.ok(!ids.includes('strike') && !ids.includes('guard'));
  }
  assert.equal(cardChoices(rngFor(1, 1), { housePlanets: [], cls: 'Sun', count: 4 }).length, 4);
  assert.ok(price('stoneWall') > price('strike'));
});

test('twelve stories, one per house, each with two answers that move karma or something else', () => {
  assert.equal(STORIES.length, 12);
  STORIES.forEach((s, i) => {
    assert.equal(s.house, i + 1);
    assert.equal(s.options.length, 2);
    for (const o of s.options) assert.ok(o.outcome.text.length > 10);
    for (const o of s.options) if (o.outcome.addCard) assert.ok(CARDS[o.outcome.addCard], o.outcome.addCard);
  });
});

test('story outcomes change the run, and health never drops to 0 from a story', () => {
  const run = newRun(reading, 1, { pressing: 'Saturn' });
  run.hp = 4; run.prana = 5;
  const notes = applyOutcome(run, { karma: 2, hp: -10, prana: -15, addCard: 'eclipse', text: 'x' }, rngFor(1, 1));
  assert.equal(run.hp, 1);
  assert.equal(run.prana, 0);
  assert.equal(run.karma, 2);
  assert.ok(run.deck.includes('eclipse'));
  assert.ok(notes.length >= 2);
  const before = run.deck.filter(c => c === 'strike').length;
  applyOutcome(run, { karma: 1, removeCard: 'strike', text: 'x' }, rngFor(1, 2));
  assert.equal(run.deck.filter(c => c === 'strike').length, before - 1);
  applyOutcome(run, { karma: 0, upgrade: 'random', text: 'x' }, rngFor(1, 3));
  assert.equal(run.deck.filter(c => c.endsWith('+')).length, 1);
  for (let i = 0; i < 6; i++) upgradeCard(run, 0);
  assert.ok(run.deck[0].endsWith('+++') && !run.deck[0].endsWith('++++'), 'a card stops at level 4');
});
