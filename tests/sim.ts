/* A whole-run simulator for balance: two bots walk full runs on made-up charts, taking rewards,
   story choices and rest places the way a player would.
   - careless: plays whatever it can, left to right, and takes the first card offered (how Sahan tested it).
   - steady: guards when hit is coming, focuses the weakest foe, and picks cards with a simple taste.
   Run directly to see the numbers:  npx tsx tests/sim.ts */
import { houseSteps, newRun, advance, currentStep, applyOutcome, upgradeCard, PRANA, type RunState } from '../src/game/run';
import { startCombat, playCard, endTurn, intentOf, cantPlay, type CombatState } from '../src/game/combat';
import { CARDS, canUpgrade } from '../src/game/cards';
import { STORIES } from '../src/game/stories';
import { cardChoices, price } from '../src/game/rewards';
import { rngFor } from '../src/rng';
import type { Reading } from '../src/seed';

const SIGN_EL = ['fire', 'earth', 'air', 'water'];
const LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export function fakeReading(seed: number): Reading {
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

type Style = 'careless' | 'steady';

const incoming = (s: CombatState) => s.enemies.reduce((n, e, i) => n + (e.hp > 0 ? intentOf(s, i).reduce((m, it) => m + (it.kind === 'attack' ? it.each * it.times : 0), 0) : 0), 0);
const blocks = (id: string) => CARDS[id].effects.some(e => e.kind === 'block');
const value = (id: string) => {
  const d = CARDS[id];
  let v = 0;
  for (const e of d.effects) {
    if (e.kind === 'damage') v += e.amount * (e.times ?? 1) + (e.perTurn ? 6 : 0);
    else if (e.kind === 'drain') v += e.amount * 1.4;
    else if (e.kind === 'block') v += e.amount * 0.8;
    else if (e.kind === 'draw') v += e.n * 4;
    else if (e.kind === 'breath') v += e.n * 6;
    else if (e.kind === 'status') v += e.amount * (e.status === 'charmed' ? 8 : e.status === 'might' ? 5 : 3);
    else if (e.kind === 'heal') v += e.amount;
    else if (e.kind === 'loseHp') v -= e.amount * 0.6;
  }
  return v / Math.max(0.6, d.cost);
};

function fight(s: CombatState, style: Style) {
  for (let g = 0; g < 400 && s.phase === 'player'; g++) {
    let played = true;
    while (played && s.phase === 'player') {
      played = false;
      const live = s.enemies.map((e, i) => [e, i] as const).filter(([e]) => e.hp > 0);
      if (!live.length) break;
      let order = s.hand.map((_, i) => i).filter(i => !cantPlay(s, i));
      let target = live[0][1];
      if (style === 'steady') {
        target = live.reduce((a, b) => (b[0].hp < a[0].hp ? b : a))[1];
        const need = incoming(s) > s.player.block;
        order.sort((a, b) => {
          const A = s.hand[a].id, B = s.hand[b].id;
          const sa = value(A) + (need && blocks(A) ? 20 : 0) + (CARDS[A].cost === 0 ? 5 : 0);
          const sb = value(B) + (need && blocks(B) ? 20 : 0) + (CARDS[B].cost === 0 ? 5 : 0);
          return sb - sa;
        });
      }
      if (order.length) { playCard(s, order[0], target); played = true; }
    }
    if (s.phase === 'player') endTurn(s);
  }
}

export function simRun(seed: number, style: Style, runNo = 1): { reached: number; minutes: number; fights: number } {
  const r = fakeReading(seed), run: RunState = newRun(r, runNo, { pressing: 'Saturn' });
  const rng = rngFor(seed, 99);
  let turns = 0, fights = 0, screens = 0;
  while (!run.over) {
    const st = currentStep(r, run), h = r.houses[run.house - 1];
    screens++;
    if (st.enemies) {
      const { state } = startCombat({ deck: run.deck, enemies: st.enemies, ground: h.element as 'fire', seed, run: runNo, fight: run.fights++, hp: run.hp, maxHp: run.maxHp, mods: { cls: r.cls.ruler } });
      fight(state, style);
      fights++; turns += state.turn;
      if (state.phase !== 'won') { run.over = 'lost'; break; }
      run.hp = state.player.hp;
      run.prana += PRANA[st.kind];
      const boss = st.enemies.find(e => e.planet);
      const ids = cardChoices(rngFor(seed, 500 + run.fights), { housePlanets: boss?.planets ?? (boss?.planet ? [boss.planet] : h.planets.map(p => p.name)), cls: r.cls.ruler });
      if (style === 'careless') run.deck.push(ids[0]);
      else { const best = ids.reduce((a, b) => (value(b) > value(a) ? b : a)); if (value(best) > 5.5 || run.deck.length < 14) run.deck.push(best); else run.prana += 5; }
    } else if (st.kind === 'story') {
      const story = STORIES.find(x => x.house === run.house)!;
      const pick = style === 'careless' ? story.options[rng.int(0, 1)] : story.options.find(o => (o.outcome.hp ?? 0) >= 0 || run.hp > run.maxHp * 0.6) ?? story.options[1];
      if ((pick.outcome.prana ?? 0) + run.prana >= 0 || true) applyOutcome(run, pick.outcome, rng);
    } else if (st.kind === 'rest') {
      const heal = Math.min(run.maxHp - run.hp, Math.round(run.maxHp * (h.lord === 'Moon' ? 0.5 : 0.3)));
      const up = run.deck.findIndex(c => canUpgrade(c) && (style === 'careless' || CARDS[c].type === 'attack' || value(c) > 6));
      if (run.hp < run.maxHp * 0.55 || up < 0) run.hp += heal; else upgradeCard(run, up);
      if (h.lord === 'Sun') { if (up >= 0) upgradeCard(run, up); }
      if (style === 'steady') {
        const stall = cardChoices(rngFor(seed, 900 + run.house), { housePlanets: [h.lord], cls: r.cls.ruler });
        const best = stall.reduce((a, b) => (value(b) > value(a) ? b : a));
        if (run.prana >= price(best) && value(best) > 6) { run.prana -= price(best); run.deck.push(best); }
      }
    }
    advance(r, run);
  }
  // a rough clock: ~9 s a turn, ~25 s for every other screen (map, rewards, story, rest)
  const minutes = (turns * 9 + screens * 25) / 60;
  return { reached: run.over === 'won' ? 13 : run.house, minutes, fights };
}

export function summary(style: Style, n = 120) {
  const res = Array.from({ length: n }, (_, i) => simRun(i + 1, style));
  const avg = res.reduce((a, b) => a + b.reached, 0) / n;
  const wins = res.filter(x => x.reached === 13).length / n;
  const win = res.filter(x => x.reached === 13);
  const mins = win.length ? win.reduce((a, b) => a + b.minutes, 0) / win.length : 0;
  const hist = Array.from({ length: 13 }, (_, i) => res.filter(x => x.reached === i + 1).length);
  return { avg, wins, mins, hist, fights: res.reduce((a, b) => a + b.fights, 0) / n };
}

if (process.argv[1]?.endsWith('sim.ts')) {
  for (const s of ['careless', 'steady'] as const) {
    const m = summary(s);
    console.log(`${s.padEnd(9)} avg house ${m.avg.toFixed(1)} · wins ${(m.wins * 100).toFixed(0)}% · a winning run ≈ ${m.mins.toFixed(0)} min · fights ${m.fights.toFixed(1)} · reached ${m.hist.join(' ')}`);
  }
}
