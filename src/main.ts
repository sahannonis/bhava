// Latin letters only (with accents for place names); the other scripts would add ~600 kB for nothing
import '@fontsource/marcellus/latin-400.css';
import '@fontsource/marcellus/latin-ext-400.css';
import '@fontsource/alegreya/latin-400.css';
import '@fontsource/alegreya/latin-ext-400.css';
import '@fontsource/alegreya/latin-400-italic.css';
import '@fontsource/alegreya/latin-700.css';
import '@fontsource/alegreya/latin-ext-700.css';
import './style.css';
import { findPlaces, loadPlaces, placeFromCoords, placeLabel, type Place } from './places';
import { castChart, ordinal, type Birth, type Reading } from './seed';
import { chartSvg } from './chartSvg';
import { ENEMIES, GROUND, KIND_NAME, REMEDY, REST_GIFT, TRANSIT_LINE } from './content';
import { moonSvg, todaySky, type Sky } from './today';
import { startStarlight } from './ambience';
import { sfx, unlockAudio } from './sound';
import { showHub } from './hubView';
import { canRemind, refreshReminder, setReminder } from './remind';
import { loadMeta, withMeta } from './metaStore';
import { chosenLife, endOfRun, perks, runKarma, streakNow, triesLeft, wonToday } from './game/meta';
import { YOGAS, knownYogas, yogaEffectText, yogaText } from './game/yogas';
import { showFight } from './combatView';
import { CARDS, GIFT_CARD, starterDeck } from './game/cards';
import { getSettings, setSetting } from './settings';
import { buzz } from './haptics';
import { loadRun, saveRun, nextRunNumber, endRun, loadCleared } from './runStore';
import { newRun, houseSteps, STEP_NAME, type RunState } from './game/run';
import { continueRun } from './runView';
import type { Mods } from './game/combat';
import { forgetBirth, loadBirth, saveBirth } from './store';

const app = document.getElementById('app')!;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- birth entry ---------- */
function showBirth(prev: Birth | null) {
  let place: Place | null = prev ? prev.place : null;
  app.innerHTML = `
  <main class="leaf birth">
    <header class="title">
      ${starWheel()}
      <h1>Bhava</h1>
      <p class="sub">The Twelve Houses</p>
    </header>
    <p class="lead">Your birth moment builds your twelve houses. Enter it as exactly as you can.</p>
    <form id="birth" novalidate>
      <label class="field">
        <span>Date of birth</span>
        <input id="date" type="date" min="1900-01-01" max="${today()}" value="${prev ? prev.date : ''}" required />
      </label>
      <label class="field">
        <span>Time of birth</span>
        <input id="time" type="time" value="${prev && prev.time ? prev.time : ''}" />
        <small>Leave it blank if you don't know it. Your houses will be read from the Moon instead.</small>
      </label>
      <div class="field" id="placeField">
        <label for="placeQ">Place of birth</label>
        <div id="placeChosen" class="chosen" hidden>
          <span id="placeName"></span>
          <button type="button" class="link" id="placeChange">Change</button>
        </div>
        <div id="placePick">
          <input id="placeQ" type="search" autocomplete="off" placeholder="Town or city" role="combobox" aria-expanded="false" aria-controls="placeList" />
          <ul id="placeList" class="suggest" role="listbox"></ul>
          <small id="placeState">Loading places…</small>
          <button type="button" class="link" id="coordsOpen">Can't find it? Enter map coordinates</button>
          <div id="coordsBox" hidden>
            <input id="coords" type="text" inputmode="decimal" placeholder="e.g. 6.927, 79.861" />
            <button type="button" class="ghost" id="coordsUse">Use these</button>
          </div>
        </div>
      </div>
      <p id="err" class="err" role="alert"></p>
      <button class="primary" type="submit">Cast my chart</button>
      <p class="private">Your birth stays on this phone. Nothing is sent anywhere.</p>
    </form>
  </main>`;

  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const q = $<HTMLInputElement>('placeQ'), list = $<HTMLUListElement>('placeList'), state = $('placeState');
  let matches: Place[] = [];

  const choose = (p: Place | null) => {
    place = p;
    $('placeChosen').hidden = !p;
    $('placePick').hidden = !!p;
    if (p) $('placeName').textContent = placeLabel(p);
    list.innerHTML = ''; q.setAttribute('aria-expanded', 'false');
  };
  choose(place);

  loadPlaces()
    .then(() => { state.textContent = ''; if (q.value) render(); })
    .catch(() => { state.textContent = 'The place list could not load. Use map coordinates below.'; });

  const render = () => {
    matches = findPlaces(q.value);
    list.innerHTML = matches.map((p, i) =>
      `<li role="option" data-i="${i}"><b>${esc(p.name)}</b> <span>${esc([p.prov, p.country].filter(x => x && x !== p.name).join(', '))}</span></li>`).join('');
    q.setAttribute('aria-expanded', String(matches.length > 0));
    if (q.value.trim().length >= 2 && !matches.length && !state.textContent) state.textContent = 'No match yet. Try the nearest town, or map coordinates.';
    else if (matches.length) state.textContent = '';
  };
  let t = 0;
  q.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(render, 120); });
  list.addEventListener('click', e => {
    const li = (e.target as HTMLElement).closest('li');
    if (li) choose(matches[+li.dataset.i!]);
  });
  $('placeChange').addEventListener('click', () => { choose(null); q.focus(); });
  $('coordsOpen').addEventListener('click', () => { $('coordsBox').hidden = false; $('coords').focus(); });
  $('coordsUse').addEventListener('click', () => {
    const p = placeFromCoords($<HTMLInputElement>('coords').value);
    $('err').textContent = p ? '' : 'Those coordinates were not understood. Paste them like 6.927, 79.861.';
    if (p) choose(p);
  });

  $('birth').addEventListener('submit', async e => {
    e.preventDefault();
    const date = $<HTMLInputElement>('date').value, time = $<HTMLInputElement>('time').value || null;
    const err = $('err');
    if (!date) { err.textContent = 'Enter your date of birth.'; return; }
    if (date > today()) { err.textContent = 'That date is in the future.'; return; }
    if (!place) { err.textContent = 'Pick your place of birth from the list.'; return; }
    err.textContent = '';
    const birth: Birth = { date, time, place };
    await saveBirth(birth);
    showChart(castChart(birth));
  });
}

/* ---------- the run map ---------- */
const DIGNITY: Record<string, string> = { exalted: 'exalted', 'own sign': 'in its own sign', debilitated: 'debilitated' };

function foeLine(p: { name: string; dignity: string; strength: string; retro: boolean }): string {
  const bits = [p.name, DIGNITY[p.dignity], p.retro ? 'retrograde' : ''].filter(Boolean).join(', ');
  const power = p.strength === 'strong' ? 'Strong' : p.strength === 'weak' ? 'Weak' : '';
  return `<li><span class="foe pl-${p.name.toLowerCase()}">${ENEMIES[p.name].name}</span>
    <span class="foe-what">${bits}${power ? `. <b>${power}</b>` : ''}</span></li>`;
}

function housePanel(r: Reading, n: number, current: number): string {
  const h = r.houses[n - 1], g = GROUND[h.element];
  let body = '';
  if (h.planets.length) {
    const intro = h.kind === 'gate' ? 'The final gate is held by' : h.kind === 'boss' ? 'Its planets join into one boss:' : 'You face';
    body = `<p>${intro}</p><ul class="foes">${h.planets.map(foeLine).join('')}</ul>`;
  } else if (h.kind === 'gate') {
    body = '<p>Every run ends here. Your 12th house is empty, so the gate is held by a shade of your own lagna lord.</p>';
  } else {
    body = `<p>A lesser spirit guards the way, then a rest place: heal or raise a card a level, and buy cards with prana.</p>
      <p class="gift">Its lord, ${h.lord}, sits in your ${ordinal(h.lordHouse)} house. <b>${REST_GIFT[h.lord]}</b></p>`;
  }
  const where = n === current ? 'You stand at its door.' : n < current ? 'Cleared.' : `Reached after the ${ordinal(n - 1)} house.`;
  return `<div class="panel-head">
      <h2>${ordinal(n)} house, ${h.signName}</h2>
      <span class="kind kind-${h.kind}">${KIND_NAME[h.kind]}</span>
    </div>
    <p class="ground"><b>${g.name}.</b> ${g.rule}</p>
    ${body}
    <p class="where">${where} Clear it to read what this house says about you.</p>`;
}

/* The numbers behind the chart, for anyone who wants to check them. */
const dms = (deg: number) => { const d = Math.floor(deg), m = Math.floor((deg - d) * 60); return `${d}\u00b0${String(m).padStart(2, '0')}\u2032`; };
function chartDetails(r: Reading): string {
  const c = r.chart as Reading['chart'] & { ayanamsa: number; lagna: { nakName?: string; pada?: number } };
  const rows = [
    `<tr><th scope="row">Lagna</th><td>${E_SIGN(c.lagna.sign)} ${dms(c.lagna.deg)}</td><td>${c.lagna.nakName ?? ''}${c.lagna.pada ? ` ${c.lagna.pada}` : ''}</td><td>1</td><td>${r.timeKnown ? '' : 'from the Moon'}</td></tr>`,
    ...c.planets.map(p => `<tr><th scope="row" class="pl-${p.name.toLowerCase()}">${p.name}</th><td>${E_SIGN(p.sign)} ${dms(p.deg)}</td><td>${p.nakName} ${p.pada}</td><td>${p.house}</td><td>${[p.dignity, p.retro && p.name !== 'Rahu' && p.name !== 'Ketu' ? 'retrograde' : ''].filter(Boolean).join(', ')}</td></tr>`),
  ].join('');
  const utc = new Date(r.utc).toISOString().replace('T', ' ').slice(0, 16);
  return `<details class="details" id="details">
    <summary>Your chart in detail</summary>
    <div class="table-wrap"><table>
      <thead><tr><th scope="col">Body</th><th scope="col">Sign and degree</th><th scope="col">Nakshatra, pada</th><th scope="col">House</th><th scope="col">Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="method">Worked out the way a Jyotishi does: the sidereal zodiac with the Lahiri ayanamsa (${dms(c.ayanamsa)} at your birth), whole-sign houses counted from your lagna, and your birth moment turned into world time with the clock your birthplace used then (${utc} UTC, ${r.offset}). Planet positions come from Astronomy Engine and match Swiss Ephemeris, the astrologers' standard, to within 20 arcseconds across 300 test charts.</p>
  </details>`;
}

/* What today's planets are doing over one house. */
function skyPanel(r: Reading, n: number, sky: Sky): string {
  const h = r.houses[n - 1];
  const here = sky.transits.filter(t => t.house === n);
  const list = here.length
    ? `<ul class="foes">${here.map(t => `<li><span class="foe pl-${t.name.toLowerCase()}">${t.name}${t.retro ? ', retrograde' : ''}</span>
        <span class="foe-what">${ordinal(t.fromMoon)} from your birth Moon, a <b>${t.good ? 'good' : 'hard'} place</b>. ${t.good ? TRANSIT_LINE[t.name].good : TRANSIT_LINE[t.name].hard}</span></li>`).join('')}</ul>`
    : '<p>No planets are crossing this house today.</p>';
  const born = h.planets.length ? `Born here: ${h.planets.map(p => p.name).join(', ')}.` : 'No birth planets here.';
  return `<div class="panel-head">
      <h2>${ordinal(n)} house, ${h.signName}</h2>
      <span class="kind">Today</span>
    </div>
    ${list}
    <p class="where">${born} Transits are counted from your birth Moon, in ${E_SIGN(r.chart.by.Moon.sign)}.</p>`;
}
const E_SIGN = (n: number) => ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][n];

function skyStrip(sky: Sky): string {
  const notes = [
    sky.chandrashtama ? '<p class="sky-note"><b>Chandrashtama today.</b> The Moon is 8th from your birth Moon: a day to go gently and put off big decisions.</p>' : '',
    sky.sadeSati ? `<p class="sky-note"><b>Sade Sati${sky.sadeSati === 'rising' ? ', first part' : sky.sadeSati === 'peak' ? ', the middle' : ', last part'}.</b> Saturn's seven and a half years over your Moon. Slow, steady work carries you through.</p>` : '',
  ].join('');
  const rem = REMEDY[sky.pressing];
  return `${moonSvg(sky.elong)}
    <div class="sky-text">
      <p class="sky-title"><span class="pl-moon">${sky.title}</span> today, in ${sky.signName}</p>
      <p>${sky.effect}</p>
      <small>${Math.round(sky.lit * 100)}% lit, ${sky.elong < 180 ? 'growing' : 'shrinking'}</small>
    </div>
    ${notes || sky.blessing ? `<div class="sky-notes">${notes}${sky.blessing ? `<p class="sky-note"><b>Blessing of <span class="pl-${sky.blessing.toLowerCase()}">${sky.blessing}</span>.</b> In a good place for your Moon today, it lends you ${CARDS[GIFT_CARD[sky.blessing]].name} in every fight.</p>` : ''}</div>` : ''}
    <details class="remedy" id="remedy">
      <summary><span>Today's remedy, for <span class="pl-${sky.pressing.toLowerCase()}">${sky.pressing}</span></span></summary>
      <p class="mantra">${rem.mantra}</p>
      <p>Say it softly 11 times. ${rem.act} ${rem.practice}</p>
      <small>For reflection, not a promise. In a run, doing it at a shrine softens ${sky.pressing}'s enemies for the day.</small>
    </details>`;
}

const SWATCH = (kind: string) => `<svg class="swatch" viewBox="0 0 18 18" aria-hidden="true">
  ${kind === 'rest' ? '' : `<rect width="18" height="18" fill="url(#hatch-${kind})" />`}<rect class="sw-edge" x="0.75" y="0.75" width="16.5" height="16.5" /></svg>`;
const LEGEND_BIRTH = `<li>${SWATCH('fight')}Fight</li><li>${SWATCH('boss')}Boss</li><li>${SWATCH('gate')}Final gate</li><li>${SWATCH('rest')}Rest place</li>
      <li><svg class="swatch" viewBox="0 0 18 18" aria-hidden="true"><line class="here-mark" x1="2" y1="9" x2="17" y2="9" /></svg>You are here</li>`;
const LEGEND_SKY = `<li><svg class="swatch" viewBox="0 0 18 18" aria-hidden="true"><line class="hard-mark" x1="2" y1="12" x2="16" y2="12" /></svg>Underlined: a hard place for your Moon today</li>`;

function showChart(r: Reading) {
  const local = new Intl.DateTimeFormat('en-GB', {
    timeZone: r.birth.place.tz, day: 'numeric', month: 'long', year: 'numeric',
    ...(r.timeKnown ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(r.utc));
  const lagnaName = r.houses[0].signName;
  const sky = todaySky(r);
  const run = loadRun();
  const cleared = loadCleared();
  const current = run ? run.house : 1;
  const mm = loadMeta(), today = sky.dayKey;
  const meta = { karma: mm.karma, lifeNext: chosenLife(mm, r.seed), streak: streakNow(mm, today), trialOpen: triesLeft(mm, today) > 0 && !wonToday(mm, today) };
  let selected = current;
  let mode: 'birth' | 'sky' = 'birth';

  app.innerHTML = `
  <main class="leaf map-screen">
    <header class="class-head">
      <p class="wordmark">Bhava</p>
      <h1>${r.cls.name}</h1>
      <p class="lead">${r.timeKnown ? 'Your lagna is' : 'Read from your Moon in'} ${lagnaName}, ruled by ${r.cls.ruler}. ${r.cls.style}</p>
      ${r.timeKnown ? '' : '<p class="note">Without a birth time, your houses are read from the Moon. Add the time if you can find it.</p>'}
    </header>
    <section class="sky" aria-label="Today's sky">${skyStrip(sky)}</section>
    <div class="modes" role="group" aria-label="Show">
      <button type="button" class="mode" id="modeBirth" aria-pressed="true">Birth chart</button>
      <button type="button" class="mode" id="modeSky" aria-pressed="false">Today's sky</button>
    </div>
    <figure class="chart-wrap" id="map">${chartSvg(r, { current, selected, cast: true, cleared })}</figure>
    <ul class="legend" id="legend" aria-label="What the ink means">${LEGEND_BIRTH}</ul>
    <section class="panel" id="panel" aria-live="polite">${housePanel(r, selected, current)}</section>
    <div class="enter">
      ${run ? `<button class="primary" id="begin">Continue in the ${ordinal(run.house)} house</button>
        <small>${run.hp} of ${run.maxHp} health · ${run.prana} prana · next: ${STEP_NAME[houseSteps(r, run, run.house)[run.step].kind].toLowerCase()}</small>`
        : `<button class="primary" id="begin">Begin your run${meta.lifeNext > 1 ? ` · life ${meta.lifeNext}` : ''}</button>
        <small>Walk your twelve houses in order, from the self to release.${cleared.length ? ` Cleared so far: ${cleared.length} of 12.` : ''}</small>`}
      <button class="ghost hub-link" id="hub"><span>The hub</span><small>${meta.karma} karma${meta.trialOpen ? " · today's trial is waiting" : meta.streak ? ` · ${meta.streak}-day streak` : ''}</small></button>
      <div class="enter-more">
        <button class="link" id="enter">Practice fight</button>
        <button class="link" id="yogaBook">Book of Yogas (${knownYogas().length} of ${YOGAS.length})</button>
        ${run ? '<button class="link" id="giveUp">Give up this run</button>' : ''}
      </div>
    </div>
    <footer class="actions">
      <p class="born">Born ${esc(local)}${r.timeKnown ? '' : ' (time unknown)'}, ${esc(placeLabel(r.birth.place))}, ${r.offset}</p>
      ${chartDetails(r)}
      <button class="ghost" id="edit">Change my birth</button>
      <div class="settings">
        <label class="switch"><input type="checkbox" id="vibe" ${getSettings().vibration ? 'checked' : ''} /> <span>Vibration</span></label>
        <button class="link" id="vibeTest">Test it</button>
        <label class="switch"><input type="checkbox" id="snd" ${getSettings().sound ? 'checked' : ''} /> <span>Sound</span></label>
        ${canRemind() ? `<label class="switch"><input type="checkbox" id="remind" ${getSettings().reminder ? 'checked' : ''} /> <span>Morning sky reminder, 8 am</span></label>` : ''}
        <button class="link" id="guideAgain">Show the fight guide again</button>
      </div>
      <button class="link" id="forget">Forget my birth on this phone</button>
    </footer>
  </main>`;

  document.getElementById('vibe')!.addEventListener('change', e => setSetting('vibration', (e.target as HTMLInputElement).checked));
  document.getElementById('vibeTest')!.addEventListener('click', () => buzz('win', true));
  document.getElementById('remind')?.addEventListener('change', async e => {
    const box = e.target as HTMLInputElement;
    box.checked = await setReminder(r, box.checked);
  });
  refreshReminder(r);
  document.getElementById('snd')!.addEventListener('change', e => { setSetting('sound', (e.target as HTMLInputElement).checked); sfx('yoga'); });
  document.getElementById('yogaBook')!.addEventListener('click', () => { sfx('tap'); showYogaBook(); });
  document.getElementById('guideAgain')!.addEventListener('click', e => { setSetting('guideDone', false); (e.target as HTMLElement).textContent = 'The guide will show in your next fight'; });
  const map = document.getElementById('map')!, panel = document.getElementById('panel')!, legend = document.getElementById('legend')!;
  const draw = (cast = false) => {
    map.innerHTML = chartSvg(r, { current: mode === 'birth' ? current : undefined, selected, cast, cleared, sky: mode === 'sky' ? sky.transits : undefined });
    panel.innerHTML = mode === 'sky' ? skyPanel(r, selected, sky) : housePanel(r, selected, current);
    panel.classList.remove('turn'); void panel.offsetWidth; panel.classList.add('turn');
  };
  const select = (n: number) => {
    selected = n;
    draw();
    const box = panel.getBoundingClientRect();
    if (box.top > window.innerHeight - 120) panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    (map.querySelector(`[data-house="${n}"]`) as SVGGElement | null)?.focus({ preventScroll: true });
  };
  const setMode = (m: 'birth' | 'sky') => {
    if (m === mode) return;
    mode = m;
    document.getElementById('modeBirth')!.setAttribute('aria-pressed', String(m === 'birth'));
    document.getElementById('modeSky')!.setAttribute('aria-pressed', String(m === 'sky'));
    legend.innerHTML = m === 'sky' ? LEGEND_SKY : LEGEND_BIRTH;
    draw(true);
  };
  document.getElementById('modeBirth')!.addEventListener('click', () => setMode('birth'));
  document.getElementById('modeSky')!.addEventListener('click', () => setMode('sky'));
  map.addEventListener('click', e => {
    const g = (e.target as Element).closest('[data-house]') as SVGGElement | null;
    if (g) select(+g.dataset.house!);
  });
  map.addEventListener('keydown', e => {
    const g = (e.target as Element).closest('[data-house]') as SVGGElement | null;
    if (!g) return;
    const n = +g.dataset.house!;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select((n % 12) + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(((n + 10) % 12) + 1); }
  });
  document.getElementById('edit')!.addEventListener('click', () => showBirth(r.birth));
  document.getElementById('forget')!.addEventListener('click', async () => { await forgetBirth(); showBirth(null); });
  document.getElementById('enter')!.addEventListener('click', () => startPractice(r, sky));
  document.getElementById('begin')!.addEventListener('click', () => beginOrContinue(r, sky, run));
  document.getElementById('hub')!.addEventListener('click', () => { sfx('tap'); openHub(r, sky); });
  document.getElementById('giveUp')?.addEventListener('click', e => {
    const b = e.target as HTMLButtonElement;
    if (b.dataset.sure && run) {
      // giving up is falling: half the karma of this life is kept
      const k = runKarma({ cleared: run.cleared, story: run.karma, won: false, life: run.life ?? 1 });
      withMeta(m => endOfRun(m, r.seed, k.total, false, run.life ?? 1));
      endRun(); showChart(r);
    } else { b.dataset.sure = '1'; b.textContent = 'Tap again to give up the run'; }
  });
  window.scrollTo(0, 0);
}

/* Today's Moon effects that change a fight. The rest (prana, karma, rest places) arrive with runs. */
function fightMods(sky: Sky): { mods: Mods; maxHpBonus: number; note?: string } {
  const n = sky.fromMoon, note = `Today's Moon: ${sky.effect}`;
  switch (n) {
    case 1: return { mods: {}, maxHpBonus: 5, note };
    case 3: return { mods: { firstCardFree: true }, maxHpBonus: 0, note };
    case 6: return { mods: { enemyHpMult: 0.9 }, maxHpBonus: 0, note };
    case 8: return { mods: { enemyDamageBonus: 1 }, maxHpBonus: 0, note };
    case 10: return { mods: { playerAttackBonus: 1 }, maxHpBonus: 0, note };
    case 12: return { mods: {}, maxHpBonus: -5, note };
    default: return { mods: {}, maxHpBonus: 0 };
  }
}

function beginOrContinue(r: Reading, sky: Sky, existing: RunState | null) {
  const fm = fightMods(sky);
  let run = existing;
  if (!run) {
    const m = loadMeta();
    run = newRun(r, nextRunNumber(), { maxHpBonus: fm.maxHpBonus, pressing: sky.pressing, life: chosenLife(m, r.seed), perks: perks(m) });
    if (sky.fromMoon === 9) run.deck[run.deck.length - 3] += '+'; // the 9th from your Moon: your signature card starts upgraded
  }
  saveRun(run);
  continueRun(app, {
    reading: r, run, mods: { ...fm.mods, cls: r.cls.ruler }, modNote: fm.note,
    blessing: sky.blessing, moonFromMoon: sky.fromMoon, pressingToday: sky.pressing, back: () => showChart(r),
    hub: () => openHub(r, todaySky(r)),
  });
}

function openHub(r: Reading, sky: Sky) {
  const fm = fightMods(sky);
  window.scrollTo(0, 0);
  showHub(app, {
    reading: r, sky, mods: { ...fm.mods, cls: r.cls.ruler, giftCard: undefined }, modNote: fm.note,
    back: () => showChart(r), play: () => beginOrContinue(r, sky, loadRun()), hasRun: !!loadRun(),
  });
}

function startPractice(r: Reading, sky: Sky) {
  const h = r.houses[0], fm = fightMods(sky), maxHp = 60 + fm.maxHpBonus + (r.cls.ruler === 'Sun' ? 8 : 0);
  showFight(app, {
    title: `${ordinal(1)} house, ${h.signName}`,
    deck: starterDeck(r.cls.ruler),
    enemies: ['shade'],
    ground: h.element as 'fire' | 'earth' | 'air' | 'water',
    seed: r.seed, run: 0, hp: maxHp, maxHp,
    mods: { ...fm.mods, cls: r.cls.ruler, giftCard: sky.blessing ? GIFT_CARD[sky.blessing] : undefined },
    modNote: fm.note, giftFrom: sky.blessing ?? undefined,
  }, () => showChart(r));
}

/* A ring of 12 houses and 27 lunar mansions, turning very slowly behind the title. */
function starWheel(): string {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6, x1 = Math.sin(a) * 118, y1 = -Math.cos(a) * 118, x2 = Math.sin(a) * 132, y2 = -Math.cos(a) * 132;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
  }).join('');
  const dots = Array.from({ length: 27 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 27 + 0.06;
    return `<circle cx="${(Math.sin(a) * 146).toFixed(1)}" cy="${(-Math.cos(a) * 146).toFixed(1)}" r="${i % 9 === 0 ? 2.6 : 1.6}" />`;
  }).join('');
  return `<svg class="wheel" viewBox="-160 -160 320 320" aria-hidden="true">
    <g class="wheel-turn">
      <circle r="118" /><circle r="132" /><circle class="wheel-thin" r="152" />
      ${ticks}<g class="wheel-dots">${dots}</g>
    </g>
  </svg>`;
}

/* ---------- start ---------- */
unlockAudio();
startStarlight();
loadBirth().then(b => (b ? showChart(castChart(b)) : showBirth(null)));

/* The yogas you have formed in fights. The ones not yet found show only which planets make them. */
function showYogaBook(): void {
  const known = new Set(knownYogas());
  const el = document.createElement('div');
  el.className = 'sheet';
  el.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true" aria-label="Book of Yogas">
    <div class="sheet-head"><h2>Book of Yogas</h2><button class="link" data-close>Close</button></div>
    <p class="sheet-note">Play cards of two planets in the same turn and they join, the way planets that meet in a chart form a yoga. ${known.size} of ${YOGAS.length} found.</p>
    <ul class="yoga-book">${YOGAS.map(y => known.has(y.id)
      ? `<li><b>${esc(y.name)}</b><span>${esc(yogaText(y))}</span><em>${esc(yogaEffectText(y))}</em></li>`
      : `<li class="unknown"><b>Not yet found</b><span>${esc(Array.isArray(y.planets[1]) ? `${y.planets[0]} with the ${y.planets[1].join(' or ')}` : `${y.planets[0]} and ${y.planets[1]}`)}</span></li>`).join('')}</ul>
  </div>`;
  document.body.appendChild(el);
  const close = () => el.remove();
  el.querySelector('[data-close]')!.addEventListener('click', close);
  el.addEventListener('click', e => { if (e.target === el) close(); });
}
