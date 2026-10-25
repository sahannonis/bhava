/* Walking a run: the opening of each house, its steps, and what comes after a fight.
   Story choices and the full rest place arrive on Day 6; karma and the hub on Day 7. */
import type { Reading } from './seed';
import { ordinal } from './seed';
import { GROUND, HOUSE_OPENING, REST_GIFT } from './content';
import { advance, currentStep, houseSteps, PRANA, STEP_NAME, type RunState, type Step } from './game/run';
import { saveRun, endRun, markCleared } from './runStore';
import { showFight } from './combatView';
import { GIFT_CARD } from './game/cards';
import type { Element, Mods } from './game/combat';
import { buzz } from './haptics';

export type RunContext = {
  reading: Reading;
  run: RunState;
  mods: Mods;              // today's fight effects and the class
  modNote?: string;
  blessing: string | null; // today's planet lending a card
  back: () => void;        // to the map
};

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function page(root: HTMLElement, inner: string) {
  root.innerHTML = `<main class="leaf run-page">${inner}</main>`;
  window.scrollTo(0, 0);
}

const stepList = (steps: Step[], at: number) => `<ol class="steps">${steps.map((s, i) =>
  `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><span>${STEP_NAME[s.kind]}</span>${s.enemy ? `<small>${esc(s.enemy.name)}</small>` : ''}</li>`).join('')}</ol>`;

/* Where the run picks up: the opening of a house, or straight into its next step. */
export function continueRun(root: HTMLElement, ctx: RunContext): void {
  const { run } = ctx;
  if (run.step === 0) houseOpening(root, ctx);
  else playStep(root, ctx);
}

function houseOpening(root: HTMLElement, ctx: RunContext) {
  const { reading: r, run } = ctx, n = run.house, h = r.houses[n - 1], g = GROUND[h.element], o = HOUSE_OPENING[n - 1];
  page(root, `
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
}

function playStep(root: HTMLElement, ctx: RunContext) {
  const { reading: r, run } = ctx, step = currentStep(r, run), h = r.houses[run.house - 1];
  if (step.kind === 'story') return storyStep(root, ctx);
  if (step.kind === 'rest') return restStep(root, ctx);
  const reward = PRANA[step.kind];
  showFight(root, {
    title: `${ordinal(run.house)} house, ${STEP_NAME[step.kind].toLowerCase()}`,
    deck: run.deck, enemies: [step.enemy!], ground: h.element as Element,
    seed: r.seed, run: run.run, fight: run.fights, hp: run.hp, maxHp: run.maxHp,
    mods: { ...ctx.mods, giftCard: ctx.blessing ? GIFT_CARD[ctx.blessing] : undefined },
    modNote: [ctx.modNote, step.enemy!.might && step.enemy!.planet === run.pressing ? `${run.pressing} presses on you today: its enemies hit 1 harder.` : ''].filter(Boolean).join(' '),
    giftFrom: ctx.blessing ?? undefined, mode: 'run', reward,
  }, res => {
    if (res.result === 'left') { saveRun(run); ctx.back(); return; }
    run.fights += 1;
    if (res.result === 'lost') { run.over = 'lost'; endRun(); return runOver(root, ctx); }
    run.hp = res.hp;
    run.prana += reward;
    next(root, ctx);
  });
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
  const { run } = ctx, o = HOUSE_OPENING[run.house - 1];
  page(root, `
    <p class="wordmark">The ${ordinal(run.house)} house · a story</p>
    <h1 class="house-title">A choice about ${esc(o.rules)}</h1>
    <p class="lead">Here the house will ask you something, and karma will remember your answer.</p>
    <p class="note">The twelve story choices arrive in the next build.</p>
    <div class="run-actions"><button class="primary" id="go">Walk on</button></div>`);
  root.querySelector('#go')!.addEventListener('click', () => next(root, ctx));
}

function restStep(root: HTMLElement, ctx: RunContext) {
  const { reading: r, run } = ctx, h = r.houses[run.house - 1];
  const share = h.lord === 'Moon' ? 0.5 : 0.3, amount = Math.min(run.maxHp - run.hp, Math.round(run.maxHp * share));
  page(root, `
    <p class="wordmark">The ${ordinal(run.house)} house · a rest place</p>
    <h1 class="house-title">A lamp is lit for you</h1>
    <p class="lead">The house is empty of planets. Its lord, ${h.lord}, sits in your ${ordinal(h.lordHouse)} house and keeps this place.</p>
    <p class="gift"><b>${esc(REST_GIFT[h.lord])}</b></p>
    <p class="run-stats">${run.hp} of ${run.maxHp} health · ${run.prana} prana</p>
    <p class="note">Upgrading cards, buying with prana, the lore stone and the shrine arrive in the next build.</p>
    <div class="run-actions"><button class="primary" id="rest">Rest${amount > 0 ? ` and heal ${amount}` : ''}</button></div>`);
  root.querySelector('#rest')!.addEventListener('click', () => {
    run.hp += amount;
    if (h.lord === 'Saturn') { run.maxHp += 4; run.hp += 4; }
    if (h.lord === 'Venus') run.prana += 10;
    buzz('tap');
    next(root, ctx);
  });
}

function houseClearedPage(root: HTMLElement, ctx: RunContext, n: number) {
  const { run } = ctx;
  page(root, `
    <p class="wordmark">The ${ordinal(n)} house</p>
    <h1 class="house-title glow">Cleared</h1>
    <p class="lead">The ${ordinal(n)} house takes its colour back. Its reading waits for you in the Journal.</p>
    <p class="note">The readings arrive on Day 8.</p>
    <p class="run-stats">${run.hp} of ${run.maxHp} health · ${run.prana} prana</p>
    <div class="run-actions">
      <button class="primary" id="go">On to the ${ordinal(run.house)} house</button>
      <button class="link" id="map">Back to your chart</button>
    </div>`);
  buzz('win');
  root.querySelector('#go')!.addEventListener('click', () => houseOpening(root, ctx));
  root.querySelector('#map')!.addEventListener('click', ctx.back);
}

function runOver(root: HTMLElement, ctx: RunContext) {
  const { run } = ctx;
  page(root, `
    <p class="wordmark">The wheel turns</p>
    <h1 class="house-title">You fall in the ${ordinal(run.house)} house</h1>
    <p class="lead">You cleared ${run.cleared.length} house${run.cleared.length === 1 ? '' : 's'} this time. What you cleared stays cleared, and its readings stay yours.</p>
    <p class="note">Karma, and the hub where you spend it, arrive on Day 7.</p>
    <div class="run-actions"><button class="primary" id="map">Back to your chart</button></div>`);
  root.querySelector('#map')!.addEventListener('click', ctx.back);
}

function runWonPage(root: HTMLElement, ctx: RunContext) {
  page(root, `
    <p class="wordmark">Beyond the twelfth house</p>
    <h1 class="house-title glow">Released</h1>
    <p class="lead">You walked all twelve houses of your chart in one life. The whole-chart reading opens.</p>
    <div class="run-actions"><button class="primary" id="map">Back to your chart</button></div>`);
  buzz('win');
  root.querySelector('#map')!.addEventListener('click', ctx.back);
}
