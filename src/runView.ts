/* Walking a run: the opening of each house, its steps, and what comes after a fight.
   Karma and the hub arrive on Day 7. */
import type { Reading } from './seed';
import { ordinal } from './seed';
import { GROUND, HOUSE_OPENING, LORE, REMEDY, REST_GIFT } from './content';
import { advance, applyOutcome, currentStep, houseSteps, PRANA, STEP_NAME, upgradeCard, type RunState, type Step } from './game/run';
import { STORIES } from './game/stories';
import { cardChoices, CUT_PRICE, price, SHARPEN_PRICE, SKIP_PRANA } from './game/rewards';
import { cardFace, pickCard, viewCards } from './cardsView';
import { rngFor } from './rng';
import { saveRun, endRun, markCleared } from './runStore';
import { showFight } from './combatView';
import { CARDS, GIFT_CARD, MAX_LEVEL, canUpgrade, levelOf } from './game/cards';
import { sfx } from './sound';
import type { Element, Mods } from './game/combat';
import { buzz } from './haptics';
import { lifeRules, runKarma, endOfRun, LIVES } from './game/meta';
import { withMeta } from './metaStore';
import { learn } from './book';
import { houseReading, FREE_HOUSES, the } from './readings';
import { readingHtml, pageNote } from './readingView';
import { ownsFull, openFullSheet } from './purchase';
import { placeArt } from './art';
const placeImg = (p: 'hub' | 'shrine' | 'gate') => (placeArt(p) ? `<img class="place-art" src="${placeArt(p)}" alt="" aria-hidden="true" />` : '');

export type RunContext = {
  reading: Reading;
  run: RunState;
  mods: Mods;              // today's fight effects and the class
  modNote?: string;
  blessing: string | null; // today's planet lending a card
  moonFromMoon: number;    // today's Moon counted from the birth Moon, for its effects outside fights
  pressingToday: string;   // today's pressing planet, for the shrine's remedy
  back: () => void;        // to the map
  hub: () => void;         // to the hub, after a run ends
};

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

let deckOf: (() => string[]) | null = null; // the run being walked, for the deck button
function page(root: HTMLElement, inner: string) {
  root.innerHTML = `<main class="leaf run-page">${inner}</main>`;
  window.scrollTo(0, 0);
  // every run page with a stats line gets a way to look at the deck
  const stats = root.querySelector('.run-stats');
  if (stats && deckOf) {
    const deck = deckOf();
    const b = document.createElement('button');
    b.className = 'link deck-link'; b.type = 'button';
    b.textContent = `Your deck (${deck.length})`;
    b.addEventListener('click', () => { sfx('tap'); viewCards('Your deck', deck); });
    stats.insertAdjacentElement('afterend', b);
  }
}

const stepList = (steps: Step[], at: number) => `<ol class="steps">${steps.map((s, i) =>
  `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><span>${STEP_NAME[s.kind]}</span>${s.enemies ? `<small>${esc(s.enemies.length > 1 && s.enemies[0].name.replace(/ I+$/, '') === s.enemies[1].name.replace(/ I+$/, '') ? `Two ${s.enemies[0].name.replace(/ I+$/, '')}s` : s.enemies.map(e => e.name).join(' and '))}</small>` : ''}</li>`).join('')}</ol>`;

/* Where the run picks up: the opening of a house, or straight into its next step. */
export function continueRun(root: HTMLElement, ctx: RunContext): void {
  const { run } = ctx;
  deckOf = () => run.deck;
  if (run.step === 0) houseOpening(root, ctx);
  else playStep(root, ctx);
}

function houseOpening(root: HTMLElement, ctx: RunContext) {
  const { reading: r, run } = ctx, n = run.house, h = r.houses[n - 1], g = GROUND[h.element], o = HOUSE_OPENING[n - 1];
  const fresh = [...learn('houses', [n]).map(() => `the ${ordinal(n)} house`), ...learn('signs', [h.sign]).map(() => h.signName)];
  page(root, `
    ${n === 12 ? placeImg('gate') : ''}
    <p class="wordmark">The ${ordinal(n)} house</p>
    <h1 class="house-title">${esc(o.rules[0].toUpperCase() + o.rules.slice(1))}</h1>
    <p class="lead opening">${esc(o.text)}</p>
    <p class="ground"><b>${g.name}.</b> In ${h.signName}, ${g.rule.charAt(0).toLowerCase() + g.rule.slice(1)}</p>
    <section class="ahead" aria-label="What lies ahead">${stepList(houseSteps(r, run, n), 0)}</section>
    <p class="run-stats">${run.hp} of ${run.maxHp} health · ${run.prana} prana</p>
    <div class="run-actions">
      <button class="primary" id="go">Enter the ${ordinal(n)} house</button>
      <button class="link" id="map">Back to your chart</button>
    </div>`);
  root.querySelector('#go')!.addEventListener('click', () => playStep(root, ctx));
  root.querySelector('#map')!.addEventListener('click', ctx.back);
  if (fresh.length) pageNote(fresh);
}

function playStep(root: HTMLElement, ctx: RunContext) {
  const { reading: r, run } = ctx, step = currentStep(r, run), h = r.houses[run.house - 1];
  if (step.kind === 'story') return storyStep(root, ctx);
  if (step.kind === 'rest') return restStep(root, ctx);
  const met = learn('planets', step.enemies!.flatMap(e => e.planets ?? (e.planet ? [e.planet] : [])));
  if (met.length) pageNote(met.map(String));
  const reward = gainPrana(ctx, PRANA[step.kind] * (ctx.moonFromMoon === 2 ? 1.1 : 1) * lifeRules(run.life).prana, false);
  showFight(root, {
    title: `${ordinal(run.house)} house, ${STEP_NAME[step.kind].toLowerCase()}`,
    deck: run.deck, enemies: step.enemies!, ground: h.element as Element,
    seed: r.seed, run: run.run, fight: run.fights, hp: run.hp, maxHp: run.maxHp,
    mods: { ...ctx.mods, giftCard: ctx.blessing ? GIFT_CARD[ctx.blessing] : undefined },
    modNote: [ctx.modNote, step.enemies!.some(e => e.might && e.planet === run.pressing) ? `${run.pressing} presses on you today: its enemies hit 1 harder.` : ''].filter(Boolean).join(' '),
    giftFrom: ctx.blessing ?? undefined, mode: 'run', reward,
  }, res => {
    if (res.result === 'left') { saveRun(run); ctx.back(); return; }
    run.fights += 1;
    if (res.result === 'lost') { run.over = 'lost'; endRun(); return runOver(root, ctx); }
    run.hp = res.hp;
    run.prana += reward;
    saveRun(run);
    rewardPage(root, ctx, step);
  });
}

/* Prana with today's Moon: the 11th from your Moon adds a quarter to all of it. */
function gainPrana(ctx: RunContext, n: number, apply = true): number {
  const got = Math.round(n * (ctx.moonFromMoon === 11 ? 1.25 : 1));
  if (apply) ctx.run.prana += got;
  return got;
}

const rngAt = (ctx: RunContext, salt: number) => rngFor(ctx.reading.seed, ctx.run.run * 1000 + salt);

/* After a won fight: pick one of three cards, or take a little prana instead. */
function rewardPage(root: HTMLElement, ctx: RunContext, step: Step) {
  const { reading: r, run } = ctx;
  const boss = step.enemies?.find(e => e.planet);
  const planets = boss?.planets ?? (boss?.planet ? [boss.planet] : r.houses[run.house - 1].planets.map(p => p.name));
  const ids = cardChoices(rngAt(ctx, 500 + run.fights), { housePlanets: planets, cls: r.cls.ruler, count: 3 + (ctx.moonFromMoon === 5 ? 1 : 0) + (run.perks?.extraChoice ?? 0) - lifeRules(run.life).fewerChoices });
  page(root, `
    <p class="wordmark">The ${ordinal(run.house)} house · after the fight</p>
    <h1 class="house-title">Take a card</h1>
    <p class="lead">What you fought leaves something behind. Choose one for your deck.</p>
    <div class="card-grid reward">${ids.map((id, i) => cardFace(id, '', `data-take="${i}"`)).join('')}</div>
    <p class="run-stats">Deck: ${run.deck.length} cards · ${run.hp} of ${run.maxHp} health · ${run.prana} prana</p>
    <div class="run-actions"><button class="link" id="skip">Spare it: take no card, gain ${SKIP_PRANA} prana and 1 karma</button></div>`);
  root.querySelectorAll<HTMLElement>('[data-take]').forEach(el => el.addEventListener('click', () => {
    run.deck.push(ids[+el.dataset.take!]);
    buzz('tap');
    next(root, ctx);
  }));
  root.querySelector('#skip')!.addEventListener('click', () => { gainPrana(ctx, SKIP_PRANA); run.karma += 1; next(root, ctx); });
}

/* After a step: on to the next, or the house is cleared. */
function next(root: HTMLElement, ctx: RunContext) {
  const { run } = ctx, house = run.house;
  const { houseCleared, runWon } = advance(ctx.reading, run);
  if (houseCleared) markCleared(house);
  if (runWon) { endRun(); return runWonPage(root, ctx); }
  saveRun(run);
  if (houseCleared) return houseClearedPage(root, ctx, house);
  playStep(root, ctx);
}

function storyStep(root: HTMLElement, ctx: RunContext) {
  const { run } = ctx, story = STORIES[run.house - 1], o = HOUSE_OPENING[run.house - 1];
  page(root, `
    <p class="wordmark">The ${ordinal(run.house)} house · ${esc(o.rules)}</p>
    <div class="scene" aria-hidden="true"><span></span><span></span><span></span></div>
    <p class="lead story-text">${esc(story.scene)}</p>
    <div class="choices">${story.options.map((op, i) => `<button class="choice" data-choice="${i}">${esc(op.label)}</button>`).join('')}</div>
    <p class="run-stats">${run.hp} of ${run.maxHp} health · ${run.prana} prana</p>
    <div class="run-actions"><button class="link" id="map">Back to your chart</button></div>`);
  root.querySelector('#map')!.addEventListener('click', ctx.back);
  root.querySelectorAll<HTMLElement>('[data-choice]').forEach(el => el.addEventListener('click', () => {
    const op = story.options[+el.dataset.choice!];
    const notes = applyOutcome(run, op.outcome, rngAt(ctx, 700 + run.house));
    saveRun(run);
    buzz('tap');
    page(root, `
      <p class="wordmark">The ${ordinal(run.house)} house · ${esc(o.rules)}</p>
      <p class="chosen-line">${esc(op.label)}</p>
      <p class="lead story-text">${esc(op.outcome.text)}</p>
      ${notes.length ? `<p class="outcome">${esc(notes.join(' · '))}</p>` : ''}
      <p class="karma-note">${op.outcome.karma > 0 ? 'Karma remembers this kindly.' : op.outcome.karma < 0 ? 'Karma remembers this too.' : 'Karma notes it, and waits.'}</p>
      <div class="run-actions"><button class="primary" id="go">Walk on</button></div>`);
    root.querySelector('#go')!.addEventListener('click', () => next(root, ctx));
  }));
}

/* A clay lamp, larger, for the rest place. */
const bigLamp = `<svg class="lamp big lit" viewBox="0 0 32 32" aria-hidden="true">
  <path class="lamp-flame" d="M16 4 C18 8 20 10 20 13 A4 4 0 0 1 12 13 C12 10 14 8 16 4 Z" />
  <path class="lamp-bowl" d="M4 19 H28 C27 25 22 28 16 28 C10 28 5 25 4 19 Z" />
  <path class="lamp-lip" d="M26 19 L30 16" />
</svg>`;

function restStep(root: HTMLElement, ctx: RunContext) {
  const { reading: r, run } = ctx, h = r.houses[run.house - 1], lord = h.lord, wayside = !!currentStep(r, run).wayside;
  const L = lifeRules(run.life);
  const heal = Math.min(run.maxHp - run.hp, Math.round(run.maxHp * ((lord === 'Moon' ? 0.5 : 0.3) + (run.perks?.restBonus ?? 0)) * (ctx.moonFromMoon === 4 ? 1.5 : 1) * L.restHeal));
  const discount = lord === 'Mercury' ? 0.25 : 0;
  const cost = (id: string) => Math.round(price(id, discount) * L.price), cutCost = Math.round(CUT_PRICE * L.price), sharpenCost = Math.round(SHARPEN_PRICE * L.price);
  let sharpened = false;
  const stall = cardChoices(rngAt(ctx, 900 + run.house), { housePlanets: [lord], cls: r.cls.ruler, count: lord === 'Jupiter' ? 4 : 3 });
  const bought = new Set<number>();
  let rested = false, meditated = false, freeCut = lord === 'Mars' || ctx.moonFromMoon === 12, remedyDone = !run.pressing;
  // Arrival gifts that need no choice
  if (lord === 'Saturn' && !run.restGiftTaken) { run.maxHp += 4; run.hp += 4; }
  if (lord === 'Venus' && !run.restGiftTaken) gainPrana(ctx, 10);
  run.restGiftTaken = true;
  saveRun(run);
  const remPlanet = run.pressing || ctx.pressingToday, rem = REMEDY[remPlanet];

  const both = lord === 'Sun';
  let restNote = '';
  const draw = () => {
    const upgradable = run.deck.some(canUpgrade);
    const usedOne = rested || meditated;
    const canRest = !rested && heal > 0 && (both || !usedOne);
    const canMeditate = !meditated && upgradable && (both || !usedOne);
    if (!upgradable && !meditated && !restNote) restNote = `Every card in your deck is at its highest level (${MAX_LEVEL + 1}).`;
    page(root, `
      ${placeImg('shrine')}
      <p class="wordmark">The ${ordinal(run.house)} house · ${wayside ? 'a wayside rest' : 'a rest place'}</p>
      <div class="rest-head">${bigLamp}<h1 class="house-title">${wayside ? 'A lamp by the road' : 'A lamp is lit for you'}</h1></div>
      <p class="lead">${wayside
        ? `The road has been long since your last rest. Past the fighting, a small lamp burns by the way, kept by this house's lord, ${the(lord)}.`
        : `No planet lives in this house. Its lord, ${the(lord)}, sits in your ${ordinal(h.lordHouse)} house and keeps this place for you.`}</p>
      <p class="gift"><b>${esc(REST_GIFT[lord])}</b></p>
      <p class="run-stats" id="stats">${run.hp} of ${run.maxHp} health · ${run.prana} prana · deck ${run.deck.length}</p>

      <section class="rest-part">
        <h2>Rest or meditate</h2>
        <p class="hint">${both ? 'The Sun keeps this place: you may rest and meditate.' : 'Choose one: rest to heal, or meditate to raise one card a level.'}</p>
        <div class="rest-row">
          <button class="ghost" id="rest" ${!canRest ? 'disabled' : ''}>${rested ? 'Rested' : `Rest: heal ${heal}`}</button>
          <button class="ghost" id="meditate" ${!canMeditate ? 'disabled' : ''}>${meditated ? 'Meditated' : 'Meditate: raise a card'}</button>
        </div>
        ${restNote ? `<p class="hint done-note">${restNote}</p>` : ''}
      </section>

      <section class="rest-part">
        <h2>The keeper's stall</h2>
        <p class="hint">Cards for prana${discount ? ', a quarter off today' : ''}.</p>
        <div class="card-grid stall">${stall.map((id, i) => `<div class="for-sale${bought.has(i) ? ' sold' : ''}">${cardFace(id, bought.has(i) || run.prana < cost(id) ? 'dim' : '', `data-buy="${i}"`)}<span class="price">${bought.has(i) ? 'Taken' : `${cost(id)} prana`}</span></div>`).join('')}</div>
        <div class="stall-more">
          <button class="ghost" id="sharpen" ${sharpened || run.prana < sharpenCost || !run.deck.some(canUpgrade) ? 'disabled' : ''}>${sharpened ? 'Sharpened' : `Sharpen a card: ${sharpenCost} prana`}</button>
          <button class="link" id="cut">Cut a card from your deck${freeCut ? ' (free here)' : ` for ${cutCost} prana`}</button>
        </div>
      </section>

      <section class="rest-part">
        <h2>The shrine</h2>
        <p>The remedy is for <span class="pl-${remPlanet.toLowerCase()}">${remPlanet}</span>: say <span class="mantra small">${rem.mantra}</span> softly 11 times. ${esc(rem.practice)}</p>
        ${run.pressing
          ? L.noRefuge ? `<p class="hint">In this life the remedy is still yours to do, but it no longer calms ${run.pressing}.</p>` : `<button class="ghost" id="remedy">I have done it</button><p class="hint">${run.pressing}'s enemies stop hitting harder for the rest of this run.</p>`
          : '<p class="hint">Done. No planet presses on this run.</p>'}
      </section>

      <details class="rest-part lore"><summary><span class="lore-stone" aria-hidden="true"></span><span>Read the lore stone<small>Tap to read what is carved here</small></span></summary><p>${esc(LORE[(run.house + run.run) % LORE.length])}</p></details>

      <div class="run-actions"><button class="primary" id="go">Walk on</button></div>`);

    root.querySelector('#rest')?.addEventListener('click', () => { run.hp += heal; rested = true; restNote = `You rest and heal ${heal}.`; buzz('tap'); sfx('heal'); saveRun(run); draw(); });
    root.querySelector('#meditate')?.addEventListener('click', async () => {
      sfx('tap');
      const i = await pickCard('Raise a card one level', run.deck, {
        disabled: id => !canUpgrade(id),
        show: id => `${id}+`,
        label: id => canUpgrade(id) ? `Level ${levelOf(id) + 1} → ${levelOf(id) + 2}` : 'Highest level',
        note: `Each card has ${MAX_LEVEL + 1} levels. You are seeing each card as it will be after this meditation: more damage, block or healing, or a lower cost.`,
      });
      if (i === null) return;
      const name = CARDS[run.deck[i]].name;
      upgradeCard(run, i); meditated = true; restNote = `${name} rises to level ${levelOf(run.deck[i]) + 1}.`;
      buzz('yoga'); sfx('upgrade'); saveRun(run); draw();
    });
    root.querySelectorAll<HTMLElement>('[data-buy]').forEach(el => el.addEventListener('click', () => {
      const i = +el.dataset.buy!, c = cost(stall[i]);
      if (bought.has(i) || run.prana < c) return;
      run.prana -= c; run.deck.push(stall[i]); bought.add(i); buzz('tap'); sfx('buy'); saveRun(run); draw();
    }));
    root.querySelector('#cut')!.addEventListener('click', async () => {
      if (!freeCut && run.prana < cutCost) return;
      const i = await pickCard('Cut a card', run.deck, { note: 'A smaller deck draws its best cards more often.' });
      if (i === null) return;
      if (!freeCut) run.prana -= cutCost; else freeCut = false;
      run.deck.splice(i, 1); buzz('tap'); saveRun(run); draw();
    });
    root.querySelector('#sharpen')?.addEventListener('click', async () => {
      if (sharpened || run.prana < sharpenCost) return;
      sfx('tap');
      const i = await pickCard('Sharpen a card', run.deck, {
        disabled: id => !canUpgrade(id), show: id => `${id}+`,
        label: id => canUpgrade(id) ? `Level ${levelOf(id) + 1} → ${levelOf(id) + 2}` : 'Highest level',
        note: 'The keeper sharpens one card for prana. This is on top of resting or meditating.',
      });
      if (i === null) return;
      run.prana -= sharpenCost; upgradeCard(run, i); sharpened = true;
      buzz('yoga'); sfx('upgrade'); saveRun(run); draw();
    });
    root.querySelector('#remedy')?.addEventListener('click', () => { run.pressing = ''; remedyDone = true; buzz('yoga'); saveRun(run); draw(); });
    root.querySelector('#go')!.addEventListener('click', () => { run.restGiftTaken = false; next(root, ctx); });
    void remedyDone;
  };
  draw();
}

function houseClearedPage(root: HTMLElement, ctx: RunContext, n: number) {
  const { run, reading: r } = ctx;
  const draw = () => {
    const locked = n > FREE_HOUSES && !ownsFull();
    page(root, `
      <p class="wordmark">The ${ordinal(n)} house</p>
      <h1 class="house-title glow">Cleared</h1>
      <p class="lead">The ${ordinal(n)} house takes its colour back, and its reading opens. It stays in your Journal for good.</p>
      <div class="reading cleared-reading">${readingHtml(houseReading(r, n), locked)}</div>
      <p class="run-stats">${run.hp} of ${run.maxHp} health · ${run.prana} prana</p>
      <div class="run-actions">
        <button class="primary" id="go">On to the ${ordinal(run.house)} house</button>
        <button class="link" id="map">Back to your chart</button>
      </div>`);
    root.querySelector('#unlockFull')?.addEventListener('click', () => openFullSheet(() => draw()));
    root.querySelector('#go')!.addEventListener('click', () => houseOpening(root, ctx));
    root.querySelector('#map')!.addEventListener('click', ctx.back);
  };
  draw();
  buzz('win');
}

/* The end of a run, won or lost: count the karma, bank it, and say what opened. */
function settle(ctx: RunContext, won: boolean) {
  const { run, reading: r } = ctx, life = run.life ?? 1;
  const k = runKarma({ cleared: run.cleared, story: run.karma, won, life });
  const { newLife } = withMeta(m => endOfRun(m, r.seed, k.total, won, life));
  return { ...k, newLife, life };
}

function karmaTable(lines: { label: string; amount: number }[], total: number) {
  return `<table class="karma-table">${lines.map(l => `<tr><td>${esc(l.label)}</td><td>${l.amount > 0 ? '+' : ''}${l.amount}</td></tr>`).join('')}
    <tr class="total"><td>Karma kept</td><td>${total}</td></tr></table>`;
}

function runOver(root: HTMLElement, ctx: RunContext) {
  const { run } = ctx, k = settle(ctx, false);
  page(root, `
    <p class="wordmark">The wheel turns</p>
    <h1 class="house-title">You fall in the ${ordinal(run.house)} house</h1>
    <p class="lead">You cleared ${run.cleared.length} house${run.cleared.length === 1 ? '' : 's'} this time. What you cleared stays cleared, and its readings stay yours. Half the karma of this life comes with you.</p>
    ${karmaTable(k.lines, k.total)}
    <div class="run-actions"><button class="primary" id="hub">Spend karma in the hub</button><button class="link" id="map">Back to your chart</button></div>`);
  sfx('lose');
  root.querySelector('#hub')!.addEventListener('click', ctx.hub);
  root.querySelector('#map')!.addEventListener('click', ctx.back);
}

function runWonPage(root: HTMLElement, ctx: RunContext) {
  const k = settle(ctx, true), nl = k.newLife ? LIVES[k.newLife - 1] : null;
  page(root, `
    ${placeImg('gate')}
    <p class="wordmark">Beyond the twelfth house</p>
    <h1 class="house-title glow">Released</h1>
    <p class="lead">You walked all twelve houses of your chart in ${k.life > 1 ? `your ${ordinal(k.life)} life` : 'one life'}. The whole-chart reading opens.</p>
    ${karmaTable(k.lines, k.total)}
    ${nl ? `<div class="new-life"><p class="wordmark">A new life opens</p><h2>Life ${nl.n}: ${esc(nl.name)}</h2><p>${esc(nl.text)} Every rule of the lives before it stays.</p></div>` : ''}
    <div class="run-actions"><button class="primary" id="hub">Go to the hub</button><button class="link" id="map">Back to your chart</button></div>`);
  buzz('win'); sfx('win');
  root.querySelector('#hub')!.addEventListener('click', ctx.hub);
  root.querySelector('#map')!.addEventListener('click', ctx.back);
}
