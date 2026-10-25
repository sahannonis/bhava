// npm test (runs with tsx)
import test from 'node:test';
import assert from 'node:assert';
import { startCombat, playCard, endTurn, intentOf, cantPlay, type StartOptions, type CombatState } from '../src/game/combat';
import { starterDeck } from '../src/game/cards';

const base = (o: Partial<StartOptions> = {}) => startCombat({
  deck: ['strike', 'strike', 'strike', 'guard', 'guard', 'ember', 'weighDown', 'openWound', 'charm', 'strike'],
  enemies: ['shade'], ground: 'air', seed: 12345, run: 0, hp: 60, maxHp: 60, ...o,
});
const find = (s: CombatState, id: string) => s.hand.findIndex(c => c.id === id);
/* put a known card into the hand so a test doesn't depend on the shuffle */
const give = (s: CombatState, id: string) => { s.hand.push({ uid: 900 + s.hand.length, id }); return s.hand.length - 1; };

test('a fight starts on turn 1 with 3 breath and a hand of 5 (6 on open sky)', () => {
  assert.equal(base({ ground: 'water' }).state.hand.length, 5);
  const { state } = base();
  assert.equal(state.hand.length, 6);
  assert.equal(state.turn, 1);
  assert.equal(state.player.breath, 3);
});

test('strike deals 6, block absorbs first, breath is spent', () => {
  const { state } = base({ ground: 'water' });
  state.enemies[0].block = 4;
  const i = give(state, 'strike');
  playCard(state, i, 0);
  assert.equal(state.enemies[0].block, 0);
  assert.equal(state.enemies[0].hp, 42 - 2);
  assert.equal(state.player.breath, 2);
});

test('weak cuts damage by a quarter, exposed adds half', () => {
  const { state } = base({ ground: 'water' });
  state.player.status.weak = 1;
  playCard(state, give(state, 'strike'), 0);
  assert.equal(state.enemies[0].hp, 42 - 4); // floor(6 * 0.75)
  delete state.player.status.weak;
  state.enemies[0].status.exposed = 1;
  playCard(state, give(state, 'strike'), 0);
  assert.equal(state.enemies[0].hp, 42 - 4 - 9);
});

test('you cannot play a card without enough breath', () => {
  const { state } = base({ ground: 'water' });
  state.player.breath = 0;
  const i = give(state, 'strike');
  assert.equal(cantPlay(state, i), 'Not enough breath.');
  assert.equal(playCard(state, i, 0).length, 0);
});

test('burning ground: the first attack each turn also burns, and burn hurts through block', () => {
  const { state } = base({ ground: 'fire' });
  playCard(state, give(state, 'strike'), 0);
  assert.equal(state.enemies[0].status.burn, 2);
  playCard(state, give(state, 'strike'), 0);
  assert.equal(state.enemies[0].status.burn, 2); // only the first attack
  const before = state.enemies[0].hp;
  state.enemies[0].block = 50;
  endTurn(state);
  assert.ok(state.enemies[0].hp <= before - 2);
});

test('heavy ground keeps block between turns; elsewhere it is lost', () => {
  for (const [ground, kept] of [['earth', true], ['air', false]] as const) {
    const { state } = base({ ground });
    state.enemies[0].status.charmed = 1; // the enemy does nothing this round
    playCard(state, give(state, 'guard'));
    endTurn(state);
    assert.equal(state.player.block, kept ? 5 : 0, ground);
  }
});

test('healing tide heals both sides at the end of their turns', () => {
  const { state } = base({ ground: 'water' });
  state.player.hp = 50;
  state.enemies[0].hp = 30;
  state.enemies[0].status.charmed = 1;
  endTurn(state);
  assert.equal(state.player.hp, 52);
  assert.equal(state.enemies[0].hp, 32);
});

test('a charmed enemy skips its action and its intent says so', () => {
  const { state } = base({ ground: 'water' });
  playCard(state, give(state, 'charm'), 0);
  assert.deepEqual(intentOf(state, 0), [{ kind: 'skip' }]);
  const hp = state.player.hp;
  const ev = endTurn(state);
  assert.ok(ev.some(e => e.t === 'skip'));
  assert.equal(state.player.hp, hp + 0); // water heal is capped at full health
});

test('intents show the damage the player will really take', () => {
  const { state } = base({ ground: 'water' });
  state.enemies[0].moveIdx = 0; // Cut, 7
  assert.deepEqual(intentOf(state, 0), [{ kind: 'attack', each: 7, times: 1 }]);
  state.enemies[0].status.weak = 1;
  assert.deepEqual(intentOf(state, 0), [{ kind: 'attack', each: 5, times: 1 }]);
  state.player.status.exposed = 1;
  assert.deepEqual(intentOf(state, 0), [{ kind: 'attack', each: 7, times: 1 }]); // floor(floor(7*.75)*1.5)
});

test('the fight can be lost', () => {
  const { state } = base({ ground: 'water', hp: 3 });
  state.enemies[0].moveIdx = 0; // Cut, 7
  const ev = endTurn(state);
  assert.equal(state.phase, 'lost');
  assert.ok(ev.some(e => e.t === 'end' && e.result === 'lost'));
});

/* A plain bot: attack when the enemy will attack less than our block can stop, otherwise guard first. */
function autoplay(state: CombatState): CombatState {
  for (let guard = 0; guard < 200 && state.phase === 'player'; guard++) {
    let played = true;
    while (played && state.phase === 'player') {
      played = false;
      const incoming = intentOf(state, 0).reduce((n, i) => n + (i.kind === 'attack' ? i.each * i.times : 0), 0);
      const order = incoming > state.player.block ? ['stoneWall', 'gurusShield', 'guard', 'blessing', 'tidecall', 'charm', 'sweetWords', 'weighDown', 'wane', 'ebb'] : [];
      const attacks = ['quickWit', 'release', 'deepBreath', 'wisdom', 'moonlight', 'doubleTalk', 'kinglyBearing', 'warCry', 'focus', 'openWound', 'feint',
        'ember', 'solarFlare', 'redRush', 'twinSpears', 'thunderbolt', 'eclipse', 'hunger', 'slowToll', 'grind', 'noon', 'silkLash', 'messenger', 'riposte', 'strike',
        'weighDown', 'wane', 'sweetWords', 'guard', 'blessing', 'tidecall', 'gurusShield', 'ebb', 'grace', 'detach', 'stoneWall'];
      for (const id of [...order, ...attacks]) {
        const i = find(state, id);
        if (i >= 0 && !cantPlay(state, i)) { playCard(state, i, 0); played = true; break; }
      }
    }
    if (state.phase === 'player') endTurn(state);
  }
  return state;
}

test('the practice fight can be won with the starter deck, the same way every time for the same birth', () => {
  const play = () => autoplay(startCombat({ deck: starterDeck('Jupiter'), enemies: ['shade'], ground: 'water', seed: 777, run: 0, hp: 60, maxHp: 60, mods: { cls: 'Jupiter' } }).state);
  const a = play(), b = play();
  assert.equal(a.phase, 'won');
  assert.equal(a.turn, b.turn);
  assert.equal(a.player.hp, b.player.hp);
});

test('every class can win the practice fight on every ground', () => {
  for (const ruler of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'])
    for (const ground of ['fire', 'earth', 'air', 'water'] as const) {
      const s = autoplay(startCombat({ deck: starterDeck(ruler), enemies: ['shade'], ground, seed: 31, run: 0, hp: 60, maxHp: 60, mods: { cls: ruler } }).state);
      assert.equal(s.phase, 'won', `${ruler} on ${ground}`);
    }
});

/* ---------- Day 4: traits, yogas, gifts ---------- */
test('class traits: Mercury draws 6, Jupiter starts with 8 block, Mars with might, Venus weakens', () => {
  const opt = (cls: string) => base({ ground: 'water', mods: { cls } }).state;
  assert.equal(opt('Mercury').hand.length, 6);
  assert.equal(opt('Jupiter').player.block, 8);
  assert.equal(opt('Mars').player.status.might, 1);
  assert.equal(opt('Venus').enemies[0].status.weak, 1);
});

test('Saturn gets a fourth breath from turn 4; the Sun gains might every third turn', () => {
  for (const [cls, check] of [['Saturn', (s: CombatState) => s.player.breath === 4], ['Sun', (s: CombatState) => s.player.status.might === 1]] as const) {
    const { state } = base({ ground: 'water', hp: 500, maxHp: 500, mods: { cls } });
    for (let i = 0; i < 3; i++) { state.enemies[0].status.charmed = 1; endTurn(state); }
    assert.equal(state.turn, 4);
    assert.ok(check(state), cls);
  }
});

test('the Moon class heals 2 at the end of each turn', () => {
  const { state } = base({ ground: 'air', mods: { cls: 'Moon' } });
  state.player.hp = 40; state.enemies[0].status.charmed = 1;
  endTurn(state);
  assert.equal(state.player.hp, 42);
});

test('two planets in one turn form a yoga, once per turn', () => {
  const { state } = base({ ground: 'water' });
  state.player.breath = 10;
  playCard(state, give(state, 'moonlight'));               // Moon
  const ev = playCard(state, give(state, 'gurusShield'));  // Jupiter: Gajakesari, 8 block
  assert.ok(ev.some(e => e.t === 'yoga' && e.id === 'gajakesari'));
  assert.equal(state.player.block, 9 + 8);
  const again = playCard(state, give(state, 'blessing'));  // Jupiter again: no second Gajakesari
  assert.ok(!again.some(e => e.t === 'yoga'));
});

test('Grahan Yoga forms with Rahu and either light', () => {
  const { state } = base({ ground: 'water' });
  state.player.breath = 10;
  playCard(state, give(state, 'ember'), 0);  // Sun
  const ev = playCard(state, give(state, 'hunger'), 0); // Rahu
  assert.ok(ev.some(e => e.t === 'yoga' && e.id === 'grahan'));
  assert.ok((state.enemies[0].status.exposed ?? 0) >= 2);
});

test('a lent gift card is in the opening hand and is used up when played', () => {
  const { state, events } = base({ ground: 'water', mods: { giftCard: 'thunderbolt' } });
  assert.ok(events.some(e => e.t === 'gift'));
  const i = state.hand.findIndex(c => c.lent);
  assert.ok(i >= 0);
  playCard(state, i, 0);
  assert.ok(state.used.some(c => c.id === 'thunderbolt'));
  assert.ok(!state.discard.some(c => c.id === 'thunderbolt'));
});

test('drain heals what gets through, cleanse clears burn, weak and exposed', () => {
  const { state } = base({ ground: 'water' });
  state.player.hp = 40;
  playCard(state, give(state, 'hunger'), 0);
  assert.equal(state.player.hp, 46);
  state.player.status = { burn: 3, weak: 2, exposed: 1, might: 2 };
  playCard(state, give(state, 'grace'));
  assert.deepEqual(state.player.status, { might: 2 });
});

test('Messenger grows with each card played before it this turn', () => {
  const { state } = base({ ground: 'water' });
  state.player.breath = 10;
  playCard(state, give(state, 'guard'));
  playCard(state, give(state, 'guard'));
  playCard(state, give(state, 'messenger'), 0);
  assert.equal(state.enemies[0].hp, 42 - 7);
});

test('every card can be described and every class deck is 11 cards', async () => {
  const { CARDS, cardText, CLASS_CARDS } = await import('../src/game/cards');
  for (const def of Object.values(CARDS)) assert.ok(cardText(def).length > 5, def.id);
  for (const ruler of Object.keys(CLASS_CARDS)) assert.equal(starterDeck(ruler).length, 11);
  assert.ok(Object.keys(CARDS).length >= 35);
});
