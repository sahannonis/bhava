/* The fight screen. It shows the state, takes taps, and plays back the events the rules return:
   cards fly, hits land with a short freeze and a shake, numbers rise like brush strokes,
   and the phone gives a small kick. With reduced motion on, the same story plays without movement. */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { CARDS, STATUS_INFO, cardText, type StatusId } from './game/cards';
import {
  attackDamage, baseDamage, cantPlay, cardCost, endTurn, intentOf, playCard, startCombat,
  type CombatEvent, type Element as Ground, type Intent, type Mods, type Who,
} from './game/combat';
import { GROUND } from './content';

export type FightSetup = {
  title: string;          // e.g. "1st house, Pisces"
  deck: string[];
  enemies: string[];
  ground: Ground;
  seed: number;
  run: number;
  hp: number;
  maxHp: number;
  mods: Mods;
  modNote?: string;       // today's effect, if it touches the fight
};
export type FightResult = { result: 'won' | 'lost' | 'left'; hp: number; turns: number };

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise(r => setTimeout(r, still() ? Math.min(ms, 60) : ms));
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const buzz = (kind: 'light' | 'medium' | 'heavy' | 'win' | 'lose') => {
  try {
    if (kind === 'win') void Haptics.notification({ type: NotificationType.Success });
    else if (kind === 'lose') void Haptics.notification({ type: NotificationType.Error });
    else void Haptics.impact({ style: kind === 'light' ? ImpactStyle.Light : kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy });
  } catch { /* no vibration on this device */ }
};

/* ---------- small ink drawings ---------- */
const ICON = {
  blade: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 L14 10 M14 10 L19 4 L20 5 L15 11 Z M6 15 L9 18 M3 21 L5 19" /></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L19 6 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V6 Z" /></svg>',
  rise: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 V5 M6 11 L12 5 L18 11" /></svg>',
  fall: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 V19 M6 13 L12 19 L18 13" /></svg>',
  crack: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L19 6 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V6 Z M12 3 L10 9 L14 12 L11 17" /></svg>',
  sleep: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13 C7 17 17 17 20 13 M7 15.5 L5.5 18 M12 16.5 V19.5 M17 15.5 L18.5 18" /></svg>',
  flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 C14 7 18 9 18 14 A6 6 0 0 1 6 14 C6 11 8 9.5 9 8 C9.5 10 10.5 11 11.5 11 C11 8 11 5.5 12 3 Z" /></svg>',
};
const STATUS_ICON: Record<StatusId, string> = { burn: ICON.flame, weak: ICON.fall, exposed: ICON.crack, might: ICON.rise, charmed: ICON.sleep };

/* A clay lamp: lit while breath remains, smoking when spent. */
const lamp = (lit: boolean) => `<svg class="lamp${lit ? ' lit' : ''}" viewBox="0 0 32 32" aria-hidden="true">
  <path class="lamp-flame" d="M16 4 C18 8 20 10 20 13 A4 4 0 0 1 12 13 C12 10 14 8 16 4 Z" />
  <path class="lamp-bowl" d="M4 19 H28 C27 25 22 28 16 28 C10 28 5 25 4 19 Z" />
  <path class="lamp-lip" d="M26 19 L30 16" />
</svg>`;

const SPLAT = 'M50 8 C58 22 74 10 70 30 C88 28 92 46 76 52 C92 64 78 82 62 72 C62 92 42 94 40 76 C26 92 8 80 22 64 C4 60 6 40 24 40 C12 24 30 10 40 24 C40 12 46 6 50 8 Z';

/* ---------- the screen ---------- */
export function showFight(root: HTMLElement, setup: FightSetup, done: (r: FightResult) => void): void {
  const { state, events: opening } = startCombat({
    deck: setup.deck, enemies: setup.enemies, ground: setup.ground,
    seed: setup.seed, run: setup.run, hp: setup.hp, maxHp: setup.maxHp, mods: setup.mods,
  });
  const g = GROUND[setup.ground];
  let selected: number | null = null; // index in hand
  let busy = false;

  root.innerHTML = `
  <main class="fight ground-${setup.ground}" aria-label="Fight">
    <header class="fight-top">
      <button class="link" id="leave">Leave</button>
      <p class="fight-where">${esc(setup.title)}</p>
      <p class="fight-turn" id="turn" aria-live="polite"></p>
    </header>
    <section class="foe-row" id="foes"></section>
    <p class="ground-line"><b>${g.name}.</b> ${g.rule}${setup.modNote ? `<br><span class="mod-note">${esc(setup.modNote)}</span>` : ''}</p>
    <section class="you" id="you" aria-label="You"></section>
    <section class="hand" id="hand" aria-label="Your hand"></section>
    <footer class="fight-bottom">
      <p class="piles" id="piles"></p>
      <button class="primary end-turn" id="end">End turn</button>
    </footer>
    <div class="banner" id="banner" aria-hidden="true"></div>
    <div class="tip" id="tip" role="status"></div>
    <div class="fx" id="fx" aria-hidden="true"></div>
  </main>`;

  const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  const fightEl = root.querySelector<HTMLElement>('.fight')!;
  const foeEl = (i: number) => root.querySelector<HTMLElement>(`[data-foe="${i}"]`);
  const whoEl = (w: Who | 'burn') => (w === 'player' ? $('you') : typeof w === 'number' ? foeEl(w) : null);

  /* ---------- drawing ---------- */
  const statusChips = (st: Partial<Record<StatusId, number>>) => (Object.keys(st) as StatusId[])
    .filter(k => st[k])
    .map(k => `<button class="chip st-${k}" data-status="${k}" aria-label="${STATUS_INFO[k].name} ${st[k]}">${STATUS_ICON[k]}<span>${st[k]}</span></button>`).join('');

  const bar = (hp: number, max: number) => `<div class="hp" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${hp}" aria-label="Health">
      <div class="hp-fill" style="width:${Math.max(0, (hp / max) * 100)}%"></div><span class="hp-num">${hp} / ${max}</span></div>`;

  const intentHtml = (list: Intent[]) => list.map(it => {
    switch (it.kind) {
      case 'attack': return `<span class="intent attack">${ICON.blade}<b>${it.each}${it.times > 1 ? `×${it.times}` : ''}</b></span>`;
      case 'block': return `<span class="intent guard">${ICON.shield}<b>${it.amount}</b></span>`;
      case 'buff': return `<span class="intent buff">${ICON.rise}<b>${STATUS_INFO[it.status].name}</b></span>`;
      case 'debuff': return `<span class="intent debuff">${ICON.fall}<b>${STATUS_INFO[it.status].name}</b></span>`;
      case 'skip': return `<span class="intent skip">${ICON.sleep}<b>Charmed</b></span>`;
    }
  }).join('');

  const intentWords = (list: Intent[]) => list.map(it =>
    it.kind === 'attack' ? `attack for ${it.each}${it.times > 1 ? `, ${it.times} times` : ''}`
      : it.kind === 'block' ? `guard for ${it.amount}` : it.kind === 'skip' ? 'skip its turn'
        : `${it.kind === 'buff' ? 'gain' : 'give you'} ${STATUS_INFO[it.status].name.toLowerCase()}`).join(', then ');

  function drawFoes() {
    $('foes').innerHTML = state.enemies.map((e, i) => {
      const dead = e.hp <= 0;
      const it = dead ? [] : intentOf(state, i);
      return `<div class="foe${dead ? ' gone' : ''}${selected !== null && CARDS[state.hand[selected]?.id]?.target === 'enemy' && !dead ? ' aim' : ''}" data-foe="${i}"
          role="button" tabindex="0" aria-label="${esc(e.name)}, ${e.hp} of ${e.maxHp} health${e.block ? `, ${e.block} block` : ''}. Next it will ${intentWords(it)}.">
        <div class="intents">${intentHtml(it)}</div>
        <div class="foe-figure"><svg viewBox="0 0 120 120" aria-hidden="true">
          <defs><radialGradient id="ink-${i}"><stop offset="0" stop-color="#241e15" stop-opacity="0.95" /><stop offset="0.62" stop-color="#241e15" stop-opacity="0.85" /><stop offset="1" stop-color="#241e15" stop-opacity="0" /></radialGradient></defs>
          <circle cx="60" cy="62" r="52" fill="url(#ink-${i})" />
          <ellipse class="eye" cx="46" cy="56" rx="5" ry="3.2" /><ellipse class="eye" cx="74" cy="56" rx="5" ry="3.2" />
        </svg></div>
        <p class="foe-name">${esc(e.name)}</p>
        <div class="stats">${bar(e.hp, e.maxHp)}${e.block ? `<span class="chip blockchip">${ICON.shield}<span>${e.block}</span></span>` : ''}${statusChips(e.status)}</div>
      </div>`;
    }).join('');
  }

  function drawYou() {
    const p = state.player;
    $('you').innerHTML = `
      <div class="you-stats">${bar(p.hp, p.maxHp)}${p.block ? `<span class="chip blockchip">${ICON.shield}<span>${p.block}</span></span>` : ''}${statusChips(p.status)}</div>
      <div class="breath" aria-label="Breath ${p.breath} of ${p.maxBreath}">${Array.from({ length: Math.max(p.maxBreath, p.breath) }, (_, i) => lamp(i < p.breath)).join('')}</div>`;
  }

  function cardHtml(i: number, enter = false) {
    const c = state.hand[i], def = CARDS[c.id];
    const cost = cardCost(state, c), why = cantPlay(state, i);
    // show attack numbers as they would land on the first living enemy
    let text = cardText(def, state.turn);
    const dmg = def.effects.find(e => e.kind === 'damage');
    const foe = state.enemies.findIndex(e => e.hp > 0);
    if (dmg && foe >= 0) {
      const real = attackDamage(state, 'player', foe, baseDamage(def, state.turn));
      text = text.replace(/Deal \d+ damage/, `Deal <b class="${real > baseDamage(def, state.turn) ? 'up' : real < baseDamage(def, state.turn) ? 'down' : ''}">${real}</b> damage`);
    }
    const n = state.hand.length, mid = (n - 1) / 2, tilt = (i - mid) * (n > 1 ? Math.min(3, 12 / n) : 0);
    return `<button class="card ${def.type}${def.planet ? ` planet-${def.planet.toLowerCase()}` : ''}${selected === i ? ' picked' : ''}${why ? ' dim' : ''}${enter ? ' enter' : ''}"
        data-card="${i}" data-uid="${c.uid}" style="--tilt:${tilt.toFixed(1)}deg;--drop:${(Math.abs(i - mid) ** 2 * 2.2).toFixed(1)}px;--delay:${enter ? i * 55 : 0}ms"
        aria-pressed="${selected === i}" aria-label="${esc(def.name)}, costs ${cost} breath. ${text.replace(/<[^>]+>/g, '')}${why ? ` ${why}` : ''}">
      <span class="cost${cost < def.cost ? ' free' : ''}">${cost}</span>
      <span class="card-name">${esc(def.name)}</span>
      <span class="card-kind">${def.type === 'attack' ? ICON.blade : ICON.shield}</span>
      <span class="card-text">${text}</span>
      ${def.planet ? `<span class="seal">${def.planet.slice(0, 2)}</span>` : ''}
    </button>`;
  }

  function drawHand(enter = false) {
    $('hand').innerHTML = state.hand.map((_, i) => cardHtml(i, enter)).join('');
    $('hand').style.setProperty('--n', String(state.hand.length));
  }

  function drawPiles() {
    $('piles').textContent = `Draw ${state.drawPile.length} · Discard ${state.discard.length}${state.used.length ? ` · Used ${state.used.length}` : ''}`;
    $('turn').textContent = `Turn ${state.turn}`;
    ($('end') as HTMLButtonElement).disabled = busy || state.phase !== 'player';
  }

  const drawAll = (enter = false) => { drawFoes(); drawYou(); drawHand(enter); drawPiles(); };

  /* ---------- effects ---------- */
  function float(target: HTMLElement | null, text: string, cls: string) {
    if (!target) return;
    const r = target.getBoundingClientRect(), box = fightEl.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = `float ${cls}`;
    el.textContent = text;
    el.style.left = `${r.left - box.left + r.width / 2}px`;
    el.style.top = `${r.top - box.top + r.height * 0.35}px`;
    $('fx').appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function splat(target: HTMLElement | null, big: boolean) {
    if (!target || still()) return;
    const r = target.getBoundingClientRect(), box = fightEl.getBoundingClientRect();
    const size = big ? 120 : 84;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 100 100');
    el.classList.add('splat');
    el.innerHTML = `<path d="${SPLAT}" />`;
    el.style.width = el.style.height = `${size}px`;
    el.style.left = `${r.left - box.left + r.width / 2 - size / 2 + (Math.random() - 0.5) * 30}px`;
    el.style.top = `${r.top - box.top + r.height * 0.4 - size / 2 + (Math.random() - 0.5) * 20}px`;
    el.style.setProperty('--rot', `${Math.random() * 360}deg`);
    $('fx').appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  const shake = (el: HTMLElement | null, strong = false) => {
    if (!el || still()) return;
    el.animate(
      strong
        ? [{ transform: 'translate(0,0)' }, { transform: 'translate(-9px,3px)' }, { transform: 'translate(8px,-4px)' }, { transform: 'translate(-5px,2px)' }, { transform: 'translate(3px,0)' }, { transform: 'translate(0,0)' }]
        : [{ transform: 'translate(0,0)' }, { transform: 'translate(-5px,1px)' }, { transform: 'translate(4px,-1px)' }, { transform: 'translate(-2px,0)' }, { transform: 'translate(0,0)' }],
      { duration: strong ? 380 : 260, easing: 'ease-out' },
    );
  };

  async function banner(text: string) {
    const b = $('banner');
    b.textContent = text;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    await sleep(650);
  }

  /* Move hp and block bars by an event without redrawing everything. */
  function nudgeBar(w: Who) {
    const el = whoEl(w);
    if (!el) return;
    const f = w === 'player' ? shown.player : shown.enemies[w];
    const fill = el.querySelector<HTMLElement>('.hp-fill'), num = el.querySelector<HTMLElement>('.hp-num');
    if (fill) fill.style.width = `${Math.max(0, (f.hp / f.maxHp) * 100)}%`;
    if (num) num.textContent = `${Math.max(0, f.hp)} / ${f.maxHp}`;
  }

  // what the bars show while events play back
  let shown = snapshot();
  function snapshot() {
    return {
      player: { hp: state.player.hp, maxHp: state.player.maxHp },
      enemies: state.enemies.map(e => ({ hp: e.hp, maxHp: e.maxHp })),
    };
  }

  async function playBack(events: CombatEvent[], before: ReturnType<typeof snapshot>) {
    shown = before;
    for (const ev of events) {
      switch (ev.t) {
        case 'turn':
          if (ev.who === 'enemy') await banner('Their turn');
          else if (ev.turn > 1) { await banner('Your turn'); }
          break;
        case 'play': {
          const def = CARDS[ev.id];
          const cardEl = root.querySelector<HTMLElement>(`.card[data-uid="${ev.uid}"]`);
          if (cardEl && !still()) {
            const target = typeof ev.target === 'number' ? foeEl(ev.target) : $('you');
            const a = cardEl.getBoundingClientRect(), b = target!.getBoundingClientRect();
            const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
            cardEl.style.zIndex = '30';
            const pull = def.type === 'attack' ? [{ transform: 'translate(0,0) scale(1.08)' }, { transform: 'translate(0,14px) scale(1.04)', offset: 0.22 }, { transform: `translate(${dx}px,${dy}px) scale(0.45) rotate(${dx > 0 ? 18 : -18}deg)`, opacity: 0.2 }]
              : [{ transform: 'translate(0,0) scale(1.08)' }, { transform: `translate(${dx * 0.3}px,${dy - 30}px) scale(0.7)`, opacity: 0 }];
            await cardEl.animate(pull, { duration: def.type === 'attack' ? 300 : 340, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished;
          }
          buzz('light');
          break;
        }
        case 'damage': {
          const el = whoEl(ev.to);
          const f = ev.to === 'player' ? shown.player : shown.enemies[ev.to as number];
          f.hp -= ev.amount;
          if (ev.from !== 'burn' && !still()) await sleep(70); // a short freeze as the hit lands
          nudgeBar(ev.to);
          if (ev.amount > 0) {
            float(el, ev.from === 'burn' ? `${ev.amount}` : `−${ev.amount}`, ev.from === 'burn' ? 'burnt' : ev.to === 'player' ? 'hurt' : 'dealt');
            splat(el, ev.amount >= 10);
            shake(el, ev.amount >= 10);
            if (ev.amount >= 10) shake(fightEl);
            if (ev.to === 'player') { fightEl.classList.remove('ouch'); void fightEl.offsetWidth; fightEl.classList.add('ouch'); }
            buzz(ev.amount >= 10 ? 'heavy' : 'medium');
          } else if (ev.blocked) float(el, 'Blocked', 'blocked');
          await sleep(ev.from === 'burn' ? 380 : 300);
          break;
        }
        case 'block': float(whoEl(ev.who), `+${ev.amount} block`, 'guarded'); await sleep(240); break;
        case 'heal': {
          const f = ev.who === 'player' ? shown.player : shown.enemies[ev.who as number];
          f.hp += ev.amount; nudgeBar(ev.who);
          float(whoEl(ev.who), `+${ev.amount}`, 'healed'); await sleep(260); break;
        }
        case 'status': float(whoEl(ev.who), `${STATUS_INFO[ev.status].name} ${ev.amount}`, `st st-${ev.status}`); await sleep(260); break;
        case 'move': {
          const el = foeEl(ev.who);
          float(el, ev.name, 'move');
          if (el && !still()) await el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(22px) scale(1.05)' }, { transform: 'translateY(0)' }], { duration: 320, easing: 'ease-in-out' }).finished;
          break;
        }
        case 'skip': float(foeEl(ev.who), 'Charmed: skips', 'move'); await sleep(500); break;
        case 'death': {
          if (ev.who !== 'player') {
            const el = foeEl(ev.who as number);
            if (el && !still()) await el.animate([{ filter: 'blur(0)', opacity: 1, transform: 'scale(1)' }, { filter: 'blur(8px)', opacity: 0, transform: 'scale(1.25) translateY(-10px)' }], { duration: 750, easing: 'ease-in', fill: 'forwards' }).finished;
          }
          break;
        }
        case 'draw': drawHand(true); drawPiles(); await sleep(120 + ev.uids.length * 55); break;
        case 'discard': {
          const els = [...root.querySelectorAll<HTMLElement>('.card')];
          if (!still()) await Promise.all(els.map((el, i) => el.animate([{ transform: getComputedStyle(el).transform, opacity: 1 }, { transform: 'translate(120px,60px) rotate(25deg) scale(0.6)', opacity: 0 }], { duration: 260, delay: i * 30, easing: 'ease-in', fill: 'forwards' }).finished));
          break;
        }
        case 'shuffle': float($('piles'), 'Shuffled', 'move'); await sleep(200); break;
        case 'end': await finish(ev.result); return;
      }
    }
    drawAll();
  }

  /* ---------- the end ---------- */
  async function finish(result: 'won' | 'lost') {
    busy = true;
    drawPiles();
    buzz(result === 'won' ? 'win' : 'lose');
    await sleep(400);
    const over = document.createElement('div');
    over.className = `over ${result}`;
    over.innerHTML = `<div class="over-card" role="dialog" aria-modal="true" aria-labelledby="overTitle">
        <h2 id="overTitle">${result === 'won' ? 'The house is cleared' : 'You fall'}</h2>
        <p>${result === 'won'
          ? `The ${esc(state.enemies[0].name.toLowerCase())} dissolves back into ink after ${state.turn} turns. You have ${state.player.hp} of ${state.player.maxHp} health left.`
          : `The ${esc(state.enemies[0].name.toLowerCase())} stands. In a run, this is where karma is kept and the wheel turns again.`}</p>
        <p class="over-note">This is the practice fight. Runs, rewards and readings come in the next builds.</p>
        <div class="over-actions">
          <button class="primary" id="again">Fight again</button>
          <button class="ghost" id="back">Back to your chart</button>
        </div>
      </div>`;
    fightEl.appendChild(over);
    (over.querySelector('#again') as HTMLButtonElement).focus();
    over.querySelector('#again')!.addEventListener('click', () => showFight(root, setup, done));
    over.querySelector('#back')!.addEventListener('click', () => done({ result, hp: state.player.hp, turns: state.turn }));
  }

  /* ---------- taps ---------- */
  function tip(text: string) {
    const t = $('tip');
    t.textContent = text;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  }

  async function play(handIdx: number, target?: number) {
    if (busy) return;
    const why = cantPlay(state, handIdx);
    if (why) { tip(why); shake(root.querySelector(`[data-card="${handIdx}"]`)); return; }
    busy = true;
    selected = null;
    drawPiles(); // End turn waits while the card plays out
    const before = snapshot();
    const events = playCard(state, handIdx, target);
    await playBack(events, before);
    busy = false;
    if (state.phase === 'player') drawAll();
  }

  $('hand').addEventListener('click', e => {
    const el = (e.target as Element).closest<HTMLElement>('.card');
    if (!el || busy) return;
    const i = +el.dataset.card!;
    const def = CARDS[state.hand[i].id];
    const living = state.enemies.filter(f => f.hp > 0).length;
    if (selected === i && (def.target === 'self' || living === 1)) { void play(i); return; }
    selected = selected === i ? null : i;
    drawHand(); drawFoes();
    if (selected !== null) tip(def.target === 'enemy' && living > 1 ? 'Tap an enemy to play it.' : 'Tap the card again, or the enemy, to play it.');
  });
  $('foes').addEventListener('click', e => {
    const chip = (e.target as Element).closest<HTMLElement>('[data-status]');
    if (chip) { const k = chip.dataset.status as StatusId; tip(`${STATUS_INFO[k].name}: ${STATUS_INFO[k].text}`); return; }
    const f = (e.target as Element).closest<HTMLElement>('[data-foe]');
    if (!f || busy) return;
    if (selected !== null && CARDS[state.hand[selected].id].target === 'enemy') void play(selected, +f.dataset.foe!);
    else tip(f.getAttribute('aria-label')!.split('. ').slice(1).join('. '));
  });
  $('you').addEventListener('click', e => {
    const chip = (e.target as Element).closest<HTMLElement>('[data-status]');
    if (chip) { const k = chip.dataset.status as StatusId; tip(`${STATUS_INFO[k].name}: ${STATUS_INFO[k].text}`); return; }
    if (selected !== null && CARDS[state.hand[selected].id].target === 'self') void play(selected);
  });
  $('end').addEventListener('click', async () => {
    if (busy || state.phase !== 'player') return;
    busy = true; selected = null; drawPiles();
    const before = snapshot();
    const events = endTurn(state);
    await playBack(events, before);
    busy = state.phase !== 'player';
    drawPiles();
  });
  $('leave').addEventListener('click', () => done({ result: 'left', hp: state.player.hp, turns: state.turn }));

  /* ---------- begin ---------- */
  busy = true;
  drawFoes(); drawYou(); drawPiles();
  void (async () => {
    await banner('Your turn');
    const draw = opening.find(e => e.t === 'draw');
    if (draw) drawHand(true);
    busy = false;
    drawPiles();
    window.scrollTo(0, 0);
  })();
}
