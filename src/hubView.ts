/* The hub: where karma is spent, the next life is chosen, and today's sky trial is faced. */
import { placeArt } from './art';
import type { Reading } from './seed';
import { ordinal } from './seed';
import type { Sky } from './today';
import type { Mods } from './game/combat';
import { showFight } from './combatView';
import { loadMeta, saveMeta, withMeta } from './metaStore';
import {
  UPGRADES, LIVES, buy, levelOf, nextCost, highestLife, chosenLife, dayKey, triesLeft, wonToday,
  streakNow, streakIfPlayed, dailyReward, recordDaily, type Meta,
} from './game/meta';
import { LESSER, PLANET_ENEMIES, scaled } from './game/enemies';
import { GIFT_CARD, starterDeck } from './game/cards';
import { cardChoices } from './game/rewards';
import { rngFor } from './rng';
import { buzz } from './haptics';
import { sfx } from './sound';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const SIGN_EL = ['fire', 'earth', 'air', 'water'] as const;
const lamp = (lit: boolean) => `<svg class="lamp${lit ? ' lit' : ''}" viewBox="0 0 32 32" aria-hidden="true"><path class="lamp-flame" d="M16 4 C18 8 20 10 20 13 A4 4 0 0 1 12 13 C12 10 14 8 16 4 Z" /><path class="lamp-bowl" d="M4 19 H28 C27 25 22 28 16 28 C10 28 5 25 4 19 Z" /><path class="lamp-lip" d="M26 19 L30 16" /></svg>`;

export type HubContext = {
  reading: Reading;
  sky: Sky;
  mods: Mods;           // today's fight effects, with the class
  modNote?: string;
  back: () => void;     // to the map
  play: () => void;     // begin a run
  hasRun: boolean;      // a run is already under way
};

/* Today's trial: today's pressing planet, on the ground of the sign today's Moon is in. */
export function trialSetup(r: Reading, sky: Sky, m: Meta) {
  const day = Math.round(Date.parse(`${sky.dayKey}T12:00:00Z`) / 86400000);
  const moon = sky.transits.find(t => t.name === 'Moon')!;
  const rng = rngFor(r.seed, 77000 + day);
  const ground = SIGN_EL[moon.sign % 4];
  // the pressing planet, with a lesser spirit of today's Moon's element beside it (about 7 in 10 careful tries win)
  const imp = scaled(rng.pick(LESSER[ground]), 6);
  const foes = [scaled(PLANET_ENEMIES[sky.pressing], 6, { pressing: true }), { ...imp, hp: Math.round(imp.hp * 0.7) }];
  // your starting deck, plus two cards of the day and the blessing's best card
  const extra = cardChoices(rng, { housePlanets: [sky.pressing], cls: r.cls.ruler, count: 2 }).map(id => `${id}+`);
  if (sky.blessing) extra.push(`${GIFT_CARD[sky.blessing]}+`);
  const maxHp = 60 + (r.cls.ruler === 'Sun' ? 8 : 0) + 5 * levelOf(m, 'vitality');
  return { foes, ground, deck: [...starterDeck(r.cls.ruler), ...extra], extra, day, maxHp, moonSign: moon.signName };
}

export function showHub(root: HTMLElement, ctx: HubContext): void {
  const { reading: r, sky } = ctx;
  const m = loadMeta();
  const today = sky.dayKey, high = highestLife(m, r.seed), life = chosenLife(m, r.seed);
  const t = trialSetup(r, sky, m);
  const left = triesLeft(m, today), won = wonToday(m, today);
  const streak = streakNow(m, today), nextStreak = streakIfPlayed(m, today);
  const lamps = Array.from({ length: 7 }, (_, i) => lamp(i < Math.min(streak, 7))).join('');

  root.innerHTML = `<main class="leaf run-page hub">
    ${placeArt('hub') ? `<img class="place-art" src="${placeArt('hub')}" alt="" aria-hidden="true" />` : ''}
    <p class="wordmark">Between lives</p>
    <h1 class="house-title">The hub</h1>
    <p class="karma-big"><span>${m.karma}</span> karma to spend</p>
    <p class="hint">Earned by clearing houses and by your choices. A full run keeps all of it; falling keeps half.</p>

    <section class="rest-part trial">
      <h2>Today's sky trial</h2>
      <p>${esc(sky.pressing)} presses on you today, on the ${t.ground} ground of today's Moon in ${esc(t.moonSign)}. One fight against it and a spirit of the day, with your starting deck and three cards of the day.</p>
      <div class="streak" aria-label="Practice streak ${streak} days">${lamps}<b>${streak}</b><small>day${streak === 1 ? '' : 's'} in a row</small></div>
      <p class="hint">${won ? 'Won today. Come back tomorrow to keep the lamps lit.'
        : left > 0 ? `Win it for ${dailyReward(nextStreak)} karma. Sitting it keeps your streak going; missing a day halves it.`
        : 'Sat today. Come back tomorrow.'}</p>
      <button class="primary" id="trial" ${left > 0 && !won ? '' : 'disabled'}>${won ? 'Won today' : left > 0 ? "Face today's trial" : 'Done for today'}</button>
    </section>

    <section class="rest-part">
      <h2>Your lives</h2>
      <p class="hint">${high > 1 ? `Winning opened life ${high}. Each life keeps the rules of the ones before it and gives 10% more karma for each life past the first.` : 'Win a run to open your next life: a harder walk through the same houses, for more karma.'}</p>
      <div class="lives" role="group" aria-label="Life for the next run">${LIVES.map(l => `<button class="life${l.n === life ? ' on' : ''}" data-life="${l.n}" ${l.n > high ? 'disabled' : ''} aria-pressed="${l.n === life}">${l.n}</button>`).join('')}</div>
      <ol class="life-rules">${LIVES.slice(1, life).map(l => `<li><b>${esc(l.name)}.</b> ${esc(l.text)}</li>`).join('') || '<li>The houses as they are.</li>'}</ol>
      ${ctx.hasRun ? '<p class="hint">The run you are in keeps its own life. The choice here is for your next run.</p>' : ''}
    </section>

    <section class="rest-part">
      <h2>Lasting gifts</h2>
      <ul class="ups">${UPGRADES.map(u => {
        const lv = levelOf(m, u.id), cost = nextCost(m, u);
        return `<li class="gift-row">
          <div><b>${esc(u.name)}</b>${u.costs.length > 1 ? ` <span class="pips">${'●'.repeat(lv)}${'○'.repeat(u.costs.length - lv)}</span>` : ''}
          <p>${esc(u.text(Math.max(1, cost === null ? lv : lv + 1)))}</p></div>
          ${cost === null ? '<span class="owned">Yours</span>' : `<button class="ghost" data-up="${u.id}" ${m.karma < cost ? 'disabled' : ''}>${cost}</button>`}
        </li>`;
      }).join('')}</ul>
    </section>

    <p class="run-stats">Runs won ${m.won} · fallen ${m.lost} · karma earned ${m.earned} · best streak ${m.daily.best}</p>
    <div class="run-actions">
      <button class="primary" id="play">${ctx.hasRun ? 'Continue your run' : `Begin a run${life > 1 ? ` in life ${life}` : ''}`}</button>
      <button class="link" id="back">Back to your chart</button>
    </div>
  </main>`;

  const redraw = () => showHub(root, ctx);
  root.querySelectorAll<HTMLElement>('[data-up]').forEach(el => el.addEventListener('click', () => {
    if (withMeta(mm => buy(mm, el.dataset.up as Parameters<typeof buy>[1]))) { buzz('yoga'); sfx('upgrade'); redraw(); }
  }));
  root.querySelectorAll<HTMLElement>('[data-life]').forEach(el => el.addEventListener('click', () => {
    withMeta(mm => { mm.chosen[r.seed] = +el.dataset.life!; }); sfx('tap'); redraw();
  }));
  root.querySelector('#trial')?.addEventListener('click', () => startTrial(root, ctx));
  root.querySelector('#play')!.addEventListener('click', ctx.play);
  root.querySelector('#back')!.addEventListener('click', ctx.back);
}

function startTrial(root: HTMLElement, ctx: HubContext) {
  const { reading: r, sky } = ctx, m = loadMeta(), t = trialSetup(r, sky, m);
  if (triesLeft(m, sky.dayKey) <= 0) return;
  // the try counts as soon as it starts, so leaving and coming back can't reroll it
  const pre = { ...m, daily: { ...m.daily, tries: { [sky.dayKey]: (m.daily.tries?.[sky.dayKey] ?? 0) + 1 } } };
  saveMeta(pre);
  showFight(root, {
    title: `Today's trial · ${sky.pressing}`, deck: t.deck, enemies: t.foes, ground: t.ground,
    seed: r.seed, run: 9000 + (t.day % 1000), hp: t.maxHp, maxHp: t.maxHp,
    mods: ctx.mods, modNote: ctx.modNote, mode: 'trial',
  }, res => {
    // undo the early count, then record the real result once
    withMeta(mm => { mm.daily.tries = m.daily.tries ?? {}; });
    const out = withMeta(mm => recordDaily(mm, sky.dayKey, res.result === 'won'));
    trialResult(root, ctx, res.result === 'won', out.streak, out.karma);
  });
}

function trialResult(root: HTMLElement, ctx: HubContext, won: boolean, streak: number, karma: number) {
  root.innerHTML = `<main class="leaf run-page">
    <p class="wordmark">Today's sky trial</p>
    <h1 class="house-title${won ? ' glow' : ''}">${won ? 'Won' : 'Not today'}</h1>
    <p class="lead">${won ? `You gain ${karma} karma.` : 'No karma this time, but you sat the trial.'} Your streak is ${streak} day${streak === 1 ? '' : 's'}${streak > 1 ? ' in a row' : ''}. Tomorrow's sky brings a new trial.</p>
    <div class="run-actions"><button class="primary" id="hub">Back to the hub</button></div>
  </main>`;
  if (won) { buzz('win'); }
  root.querySelector('#hub')!.addEventListener('click', () => showHub(root, ctx));
}

export const lifeLabel = (n: number) => (n > 1 ? `${ordinal(n)} life` : 'first life');
