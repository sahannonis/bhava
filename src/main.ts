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
import { ENEMIES, GROUND, KIND_NAME, REST_GIFT } from './content';
import { moonDay } from './today';
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
    body = `<p>A rest place. Rest, upgrade a card, or buy one with prana.</p>
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

const SWATCH = (kind: string) => `<svg class="swatch" viewBox="0 0 18 18" aria-hidden="true">
  ${kind === 'rest' ? '' : `<rect width="18" height="18" fill="url(#hatch-${kind})" />`}<rect class="sw-edge" x="0.75" y="0.75" width="16.5" height="16.5" /></svg>`;

function showChart(r: Reading) {
  const local = new Intl.DateTimeFormat('en-GB', {
    timeZone: r.birth.place.tz, day: 'numeric', month: 'long', year: 'numeric',
    ...(r.timeKnown ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(r.utc));
  const lagnaName = r.houses[0].signName;
  const day = moonDay(r);
  const current = 1;
  let selected = current;

  app.innerHTML = `
  <main class="leaf map-screen">
    <header class="class-head">
      <p class="wordmark">Bhava</p>
      <h1>${r.cls.name}</h1>
      <p class="lead">${r.timeKnown ? 'Your lagna is' : 'Read from your Moon in'} ${lagnaName}, ruled by ${r.cls.ruler}. ${r.cls.style}</p>
      ${r.timeKnown ? '' : '<p class="note">Without a birth time, your houses are read from the Moon. Add the time if you can find it.</p>'}
    </header>
    <section class="sky" aria-label="Today's sky">
      <p class="sky-title"><span class="pl-moon">${day.title}</span> today, in ${day.signName}</p>
      <p>${day.effect}</p>
    </section>
    <figure class="chart-wrap" id="map">${chartSvg(r, { current, selected })}</figure>
    <ul class="legend" aria-label="What the ink means">
      <li>${SWATCH('fight')}Fight</li><li>${SWATCH('boss')}Boss</li><li>${SWATCH('gate')}Final gate</li><li>${SWATCH('rest')}Rest place</li>
      <li><svg class="swatch" viewBox="0 0 18 18" aria-hidden="true"><line class="here-mark" x1="2" y1="9" x2="17" y2="9" /></svg>You are here</li>
    </ul>
    <section class="panel" id="panel" aria-live="polite">${housePanel(r, selected, current)}</section>
    <div class="enter">
      <button class="primary" id="enter" disabled>Enter the ${ordinal(current)} house</button>
      <small>Fights open in the next build.</small>
    </div>
    <footer class="actions">
      <p class="born">Born ${esc(local)}${r.timeKnown ? '' : ' (time unknown)'}, ${esc(placeLabel(r.birth.place))}, ${r.offset}</p>
      <button class="ghost" id="edit">Change my birth</button>
      <button class="link" id="forget">Forget my birth on this phone</button>
    </footer>
  </main>`;

  const map = document.getElementById('map')!, panel = document.getElementById('panel')!;
  const select = (n: number) => {
    selected = n;
    map.innerHTML = chartSvg(r, { current, selected });
    panel.innerHTML = housePanel(r, n, current);
    const box = panel.getBoundingClientRect();
    if (box.top > window.innerHeight - 120) panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    (map.querySelector(`[data-house="${n}"]`) as SVGGElement | null)?.focus({ preventScroll: true });
  };
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
  window.scrollTo(0, 0);
}

/* ---------- start ---------- */
loadBirth().then(b => (b ? showChart(castChart(b)) : showBirth(null)));
