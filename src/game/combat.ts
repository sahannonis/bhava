/* The fight itself: plain rules, no screen. Each action changes the state and returns a list of
   events in the order they happened, so the screen can play them back one by one. */
import { CARDS, type CardDef, type StatusId } from './cards';
import { ENEMY_DEFS, type EnemyAction, type EnemyDef, type Move } from './enemies';
import { rngFor, type Rng } from '../rng';
import { yogasFormed, type Yoga, type YogaEffect } from './yogas';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Who = 'player' | number; // a number is an enemy's place in the line
export type Statuses = Partial<Record<StatusId, number>>;
export type Fighter = { hp: number; maxHp: number; block: number; status: Statuses };
export type CardInst = { uid: number; id: string; lent?: boolean }; // lent: a gift for this fight only

export type EnemyState = Fighter & {
  def: EnemyDef;
  name: string;
  moveIdx: number;
  history: number[];
  attackedThisTurn: boolean;
};

/* Changes that come from outside the fight: today's Moon, the class, upgrades bought with karma. */
export type Mods = {
  playerAttackBonus?: number;
  enemyDamageBonus?: number;
  enemyHpMult?: number;
  firstCardFree?: boolean;
  cls?: string;        // the class's planet (lagna ruler), for its trait
  giftCard?: string;   // a card lent by today's best-placed planet, in the opening hand
};

export type CombatState = {
  turn: number;
  phase: 'player' | 'won' | 'lost';
  ground: Element;
  player: Fighter & { breath: number; maxBreath: number; drawSize: number };
  enemies: EnemyState[];
  drawPile: CardInst[];
  hand: CardInst[];
  discard: CardInst[];
  used: CardInst[];
  playerAttackedThisTurn: boolean;
  cardsPlayedThisTurn: number;
  planetsThisTurn: Set<string>;
  yogasThisTurn: Set<string>;
  mods: Mods;
  rng: Rng;
};

export type CombatEvent =
  | { t: 'turn'; who: 'player' | 'enemy'; turn: number }
  | { t: 'draw'; uids: number[] }
  | { t: 'shuffle'; n: number }
  | { t: 'discard'; uids: number[] }
  | { t: 'play'; uid: number; id: string; target: Who | null }
  | { t: 'damage'; to: Who; amount: number; blocked: number; from: Who | 'burn' }
  | { t: 'block'; who: Who; amount: number }
  | { t: 'status'; who: Who; status: StatusId; amount: number }
  | { t: 'heal'; who: Who; amount: number }
  | { t: 'move'; who: number; name: string }
  | { t: 'skip'; who: number }
  | { t: 'death'; who: Who }
  | { t: 'yoga'; id: string; name: string }
  | { t: 'trait'; text: string }
  | { t: 'gift'; uid: number; id: string }
  | { t: 'end'; result: 'won' | 'lost' };

const HAND_MAX = 10;
const isAlive = (f: Fighter) => f.hp > 0;
const fighter = (s: CombatState, w: Who): Fighter => (w === 'player' ? s.player : s.enemies[w]);

/* ---------- start ---------- */
export type StartOptions = {
  deck: string[];
  enemies: (string | EnemyDef)[];
  ground: Element;
  seed: number;
  run: number;
  fight?: number;   // which fight of the run, so each fight shuffles differently
  hp: number;
  maxHp: number;
  mods?: Mods;
};

export function startCombat(o: StartOptions): { state: CombatState; events: CombatEvent[] } {
  const rng = rngFor(o.seed, o.run * 100 + (o.fight ?? 0));
  const mods = o.mods ?? {};
  let uid = 1;
  const cards = rng.shuffle(o.deck).map(id => ({ uid: uid++, id }));
  const enemies: EnemyState[] = o.enemies.map(e => {
    const def = typeof e === 'string' ? ENEMY_DEFS[e] : e;
    const hp = Math.round(def.hp * (mods.enemyHpMult ?? 1));
    const start = rng.int(0, def.moves.length - 1);
    return { def, name: def.name, hp, maxHp: hp, block: 0, status: def.might ? { might: def.might } : {}, moveIdx: start, history: [start], attackedThisTurn: false };
  });
  const state: CombatState = {
    turn: 0, phase: 'player', ground: o.ground,
    player: { hp: o.hp, maxHp: o.maxHp, block: 0, status: {}, breath: 3, maxBreath: 3, drawSize: mods.cls === 'Mercury' ? 6 : 5 },
    enemies, drawPile: cards, hand: [], discard: [], used: [],
    playerAttackedThisTurn: false, cardsPlayedThisTurn: 0, planetsThisTurn: new Set(), yogasThisTurn: new Set(), mods, rng,
  };
  const events: CombatEvent[] = [];
  // class traits that act once, as the fight begins
  if (mods.cls === 'Mars') { state.player.status.might = 1; }
  if (mods.cls === 'Venus') enemies.forEach(e => { e.status.weak = (e.status.weak ?? 0) + 1; });
  startPlayerTurn(state, events);
  if (mods.cls === 'Jupiter') gainBlock(state, 'player', 8, events);
  if (mods.giftCard && CARDS[mods.giftCard]) {
    const g = { uid: uid++, id: mods.giftCard, lent: true };
    state.hand.push(g);
    events.push({ t: 'gift', uid: g.uid, id: g.id });
  }
  return { state, events };
}

/* ---------- reading the state ---------- */
export const enemyMove = (e: EnemyState): Move => e.def.moves[e.moveIdx];

/* What a card's damage comes to this turn before might, weak and exposed. */
export function baseDamage(def: CardDef, turn: number, playedBefore = 0): number {
  const d = def.effects.find(e => e.kind === 'damage' || e.kind === 'drain');
  if (!d) return 0;
  if (d.kind === 'drain') return d.amount;
  if (d.kind !== 'damage') return 0;
  if (d.perTurn) return Math.min(d.max ?? Infinity, d.amount + d.perTurn * (turn - 1));
  if (d.perPlayed) return Math.min(d.max ?? Infinity, d.amount + d.perPlayed * playedBefore);
  return d.amount;
}

export function cardCost(s: CombatState, c: CardInst): number {
  return s.mods.firstCardFree && s.cardsPlayedThisTurn === 0 ? 0 : CARDS[c.id].cost;
}

/* Why a card can't be played right now, or null if it can. */
export function cantPlay(s: CombatState, handIdx: number): string | null {
  if (s.phase !== 'player') return 'The fight is over.';
  const c = s.hand[handIdx];
  if (!c) return 'No such card.';
  if (cardCost(s, c) > s.player.breath) return 'Not enough breath.';
  return null;
}

/* The damage an attack would really do, after might, weak and exposed. */
export function attackDamage(s: CombatState, from: Who, to: Who, base: number): number {
  const a = fighter(s, from), b = fighter(s, to);
  let n = base + (a.status.might ?? 0) + (from === 'player' ? s.mods.playerAttackBonus ?? 0 : s.mods.enemyDamageBonus ?? 0);
  if (a.status.weak) n = Math.floor(n * 0.75);
  if (b.status.exposed) n = Math.floor(n * 1.5);
  return Math.max(0, n);
}

export type Intent =
  | { kind: 'attack'; each: number; times: number }
  | { kind: 'block'; amount: number }
  | { kind: 'buff'; status: StatusId; amount: number }
  | { kind: 'debuff'; status: StatusId; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'cleanse' }
  | { kind: 'skip' };

/* What an enemy will do next, worked out as the player would feel it. */
export function intentOf(s: CombatState, idx: number): Intent[] {
  const e = s.enemies[idx];
  if (e.status.charmed) return [{ kind: 'skip' }];
  return enemyMove(e).actions.map((a): Intent => {
    if (a.kind === 'attack') return { kind: 'attack', each: attackDamage(s, idx, 'player', a.amount), times: a.times ?? 1 };
    if (a.kind === 'block') return { kind: 'block', amount: a.amount };
    if (a.kind === 'heal') return { kind: 'heal', amount: a.amount };
    if (a.kind === 'cleanse') return { kind: 'cleanse' };
    return a.to === 'self' ? { kind: 'buff', status: a.status, amount: a.amount } : { kind: 'debuff', status: a.status, amount: a.amount };
  });
}

/* ---------- actions ---------- */
export function playCard(s: CombatState, handIdx: number, target?: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  if (cantPlay(s, handIdx)) return events;
  const card = s.hand[handIdx], def = CARDS[card.id];
  let t: number | null = null;
  if (def.target === 'enemy') {
    t = target !== undefined && s.enemies[target] && isAlive(s.enemies[target]) ? target : s.enemies.findIndex(isAlive);
    if (t < 0) return events;
  }
  const playedBefore = s.cardsPlayedThisTurn;
  s.player.breath -= cardCost(s, card);
  s.hand.splice(handIdx, 1);
  s.cardsPlayedThisTurn++;
  events.push({ t: 'play', uid: card.uid, id: card.id, target: t });

  for (const e of def.effects) {
    if (s.phase !== 'player') break;
    switch (e.kind) {
      case 'damage': {
        const base = baseDamage(def, s.turn, playedBefore);
        for (let i = 0; i < (e.times ?? 1); i++) {
          if (t === null || !isAlive(s.enemies[t])) break;
          hit(s, 'player', t, base, events);
        }
        break;
      }
      case 'drain': {
        if (t === null || !isAlive(s.enemies[t])) break;
        const got = hit(s, 'player', t, e.amount, events);
        if (got > 0) heal(s, 'player', got, events);
        break;
      }
      case 'breath': s.player.breath += e.n; break;
      case 'cleanse': {
        for (const k of ['burn', 'weak', 'exposed'] as const) delete s.player.status[k];
        break;
      }
      case 'block': gainBlock(s, 'player', e.amount, events); break;
      case 'status': addStatus(s, e.to === 'self' ? 'player' : (t as number), e.status, e.amount, events); break;
      case 'draw': drawCards(s, e.n, events); break;
      case 'heal': heal(s, 'player', e.amount, events); break;
      case 'loseHp': {
        const n = Math.min(e.amount, s.player.hp - 1); // a card never kills its own player
        if (n > 0) { s.player.hp -= n; events.push({ t: 'damage', to: 'player', amount: n, blocked: 0, from: 'player' }); }
        break;
      }
    }
  }
  (def.exhaust || card.lent ? s.used : s.discard).push(card);

  // two planets' cards in one turn can form a yoga
  if (def.planet && s.phase === 'player') {
    for (const y of yogasFormed(s.planetsThisTurn, def.planet, s.yogasThisTurn)) {
      s.yogasThisTurn.add(y.id);
      events.push({ t: 'yoga', id: y.id, name: y.name });
      applyYoga(s, y, t, events);
      if (s.phase !== 'player') break;
    }
    s.planetsThisTurn.add(def.planet);
  }
  checkEnd(s, events);
  return events;
}

function applyYoga(s: CombatState, y: Yoga, target: number | null, events: CombatEvent[]) {
  const foe = target !== null && isAlive(s.enemies[target]) ? target : s.enemies.findIndex(isAlive);
  for (const e of y.effects as YogaEffect[]) {
    if (s.phase !== 'player') return;
    switch (e.kind) {
      case 'draw': drawCards(s, e.n, events); break;
      case 'block': gainBlock(s, 'player', e.amount, events); break;
      case 'breath': s.player.breath += e.n; break;
      case 'damage': if (foe >= 0) hit(s, 'player', foe, e.amount, events, false); break;
      case 'heal': heal(s, 'player', e.amount, events); break;
      case 'loseHp': { const n = Math.min(e.amount, s.player.hp - 1); if (n > 0) { s.player.hp -= n; events.push({ t: 'damage', to: 'player', amount: n, blocked: 0, from: 'player' }); } break; }
      case 'status': if (e.to === 'self') addStatus(s, 'player', e.status, e.amount, events); else if (foe >= 0) addStatus(s, foe, e.status, e.amount, events); break;
    }
    checkEnd(s, events);
  }
}

export function endTurn(s: CombatState): CombatEvent[] {
  const events: CombatEvent[] = [];
  if (s.phase !== 'player') return events;

  // the player's turn ends
  if (s.hand.length) { events.push({ t: 'discard', uids: s.hand.map(c => c.uid) }); s.discard.push(...s.hand); s.hand = []; }
  if (s.ground === 'water') heal(s, 'player', 2, events);
  if (s.mods.cls === 'Moon') heal(s, 'player', 2, events);
  tickDown(s.player.status);

  // the enemies' turn
  events.push({ t: 'turn', who: 'enemy', turn: s.turn });
  s.enemies.forEach((e, i) => {
    if (s.phase !== 'player' || !isAlive(e)) return;
    if (s.ground !== 'earth') e.block = 0;
    e.attackedThisTurn = false;
    burnTick(s, i, events);
    if (!isAlive(e) || s.phase !== 'player') return;
    if (e.status.charmed) {
      e.status.charmed -= 1;
      if (!e.status.charmed) delete e.status.charmed;
      events.push({ t: 'skip', who: i });
    } else {
      const move = enemyMove(e);
      events.push({ t: 'move', who: i, name: move.name });
      for (const a of move.actions) {
        if (s.phase !== 'player') break;
        enemyAct(s, i, a, events);
      }
    }
    if (s.ground === 'water' && isAlive(e)) heal(s, i, 2, events);
    tickDown(e.status);
    nextMove(s, e);
  });
  if (s.phase === 'player') startPlayerTurn(s, events);
  return events;
}

/* ---------- inner workings ---------- */
function startPlayerTurn(s: CombatState, events: CombatEvent[]) {
  s.turn += 1;
  if (s.ground !== 'earth') s.player.block = 0;
  s.player.breath = s.player.maxBreath + (s.mods.cls === 'Saturn' && s.turn >= 4 ? 1 : 0);
  s.playerAttackedThisTurn = false;
  s.cardsPlayedThisTurn = 0;
  s.planetsThisTurn = new Set();
  s.yogasThisTurn = new Set();
  events.push({ t: 'turn', who: 'player', turn: s.turn });
  if (s.mods.cls === 'Sun' && s.turn % 3 === 0) { addStatus(s, 'player', 'might', 1, events); events.push({ t: 'trait', text: 'The Radiant grows stronger' }); }
  if (s.mods.cls === 'Saturn' && s.turn === 4) events.push({ t: 'trait', text: 'The Ascetic finds a fourth breath' });
  burnTick(s, 'player', events);
  if (s.phase !== 'player') return;
  drawCards(s, s.player.drawSize + (s.ground === 'air' ? 1 : 0), events);
}

function drawCards(s: CombatState, n: number, events: CombatEvent[]) {
  const got: number[] = [];
  for (let i = 0; i < n && s.hand.length < HAND_MAX; i++) {
    if (!s.drawPile.length) {
      if (!s.discard.length) break;
      s.drawPile = s.rng.shuffle(s.discard);
      s.discard = [];
      events.push({ t: 'shuffle', n: s.drawPile.length });
    }
    const c = s.drawPile.shift()!;
    s.hand.push(c);
    got.push(c.uid);
  }
  if (got.length) events.push({ t: 'draw', uids: got });
}

function hit(s: CombatState, from: Who, to: Who, base: number, events: CombatEvent[], attack = true): number {
  const target = fighter(s, to);
  const amount = attack ? attackDamage(s, from, to, base) : base;
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  const through = Math.min(target.hp, amount - blocked);
  target.hp = Math.max(0, target.hp - (amount - blocked));
  events.push({ t: 'damage', to, amount: amount - blocked, blocked, from });
  if (attack) {
    // burning ground: each side's first attack in a turn also burns
    const first = from === 'player' ? !s.playerAttackedThisTurn : !s.enemies[from].attackedThisTurn;
    if (from === 'player') s.playerAttackedThisTurn = true; else s.enemies[from].attackedThisTurn = true;
    if (s.ground === 'fire' && first && isAlive(target)) addStatus(s, to, 'burn', 2, events);
  }
  if (!isAlive(target)) events.push({ t: 'death', who: to });
  return through;
}

function enemyAct(s: CombatState, i: number, a: EnemyAction, events: CombatEvent[]) {
  if (a.kind === 'attack') {
    for (let k = 0; k < (a.times ?? 1); k++) {
      if (!isAlive(s.player)) break;
      hit(s, i, 'player', a.amount, events);
      checkEnd(s, events);
      if (s.phase !== 'player') return;
    }
  } else if (a.kind === 'block') gainBlock(s, i, a.amount, events);
  else if (a.kind === 'heal') heal(s, i, a.amount, events);
  else if (a.kind === 'cleanse') { for (const k of ['burn', 'weak', 'exposed'] as const) delete s.enemies[i].status[k]; }
  else addStatus(s, a.to === 'self' ? i : 'player', a.status, a.amount, events);
}

function gainBlock(s: CombatState, who: Who, n: number, events: CombatEvent[]) {
  fighter(s, who).block += n;
  events.push({ t: 'block', who, amount: n });
}

function addStatus(s: CombatState, who: Who, status: StatusId, n: number, events: CombatEvent[]) {
  const f = fighter(s, who);
  f.status[status] = (f.status[status] ?? 0) + n;
  events.push({ t: 'status', who, status, amount: n });
}

function heal(s: CombatState, who: Who, n: number, events: CombatEvent[]) {
  const f = fighter(s, who);
  const got = Math.min(n, f.maxHp - f.hp);
  if (got <= 0) return;
  f.hp += got;
  events.push({ t: 'heal', who, amount: got });
}

/* Burn hurts at the start of its owner's turn, through block, then fades by 1. */
function burnTick(s: CombatState, who: Who, events: CombatEvent[]) {
  const f = fighter(s, who), b = f.status.burn ?? 0;
  if (!b) return;
  f.hp = Math.max(0, f.hp - b);
  events.push({ t: 'damage', to: who, amount: b, blocked: 0, from: 'burn' });
  f.status.burn = b - 1;
  if (!f.status.burn) delete f.status.burn;
  if (!isAlive(f)) events.push({ t: 'death', who });
  checkEnd(s, events);
}

/* Weak and exposed fade by 1 at the end of their owner's turn. */
function tickDown(st: Statuses) {
  for (const k of ['weak', 'exposed'] as const) {
    if (st[k]) { st[k]! -= 1; if (!st[k]) delete st[k]; }
  }
}

function nextMove(s: CombatState, e: EnemyState) {
  const n = e.def.moves.length;
  if (e.def.order === 'cycle') e.moveIdx = (e.moveIdx + 1) % n;
  else {
    let pick = s.rng.int(0, n - 1);
    const [a, b] = e.history.slice(-2);
    if (a === pick && b === pick) pick = (pick + 1) % n; // never the same move three times running
    e.moveIdx = pick;
  }
  e.history.push(e.moveIdx);
}

function checkEnd(s: CombatState, events: CombatEvent[]) {
  if (s.phase !== 'player') return;
  if (!isAlive(s.player)) { s.phase = 'lost'; events.push({ t: 'end', result: 'lost' }); }
  else if (s.enemies.every(e => !isAlive(e))) { s.phase = 'won'; events.push({ t: 'end', result: 'won' }); }
}
