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

/* ---------- the chart ---------- */
const KIND: Record<string, string> = { fight: 'Fight', boss: 'Boss', rest: 'Rest place', gate: 'Final gate' };
const STRENGTH: Record<string, string> = { strong: 'strong', normal: '', weak: 'weak' };

function houseRow(r: Reading, n: number): string {
  const h = r.houses[n - 1];
  const planets = h.planets.length
    ? h.planets.map(p => `<span class="pl-${p.name.toLowerCase()}">${p.name}</span>${p.dignity ? `, ${p.dignity}` : ''}${STRENGTH[p.strength] ? ` (${STRENGTH[p.strength]})` : ''}${p.retro ? ', retrograde' : ''}`).join('<br>')
    : 'No planets';
  return `<li id="h-${n}" class="house-row kind-${h.kind}">
    <div class="h-head"><h3>${ordinal(n)} house</h3><span class="kind">${KIND[h.kind]}</span></div>
    <p class="h-sign">${h.signName}, ${h.element}</p>
    <p class="h-planets">${planets}</p>
    <p class="h-lord">Its lord, ${h.lord}, sits in your ${ordinal(h.lordHouse)} house.</p>
  </li>`;
}

function showChart(r: Reading) {
  const local = new Intl.DateTimeFormat('en-GB', {
    timeZone: r.birth.place.tz, day: 'numeric', month: 'long', year: 'numeric',
    ...(r.timeKnown ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(r.utc));
  const lagnaName = r.houses[0].signName;

  app.innerHTML = `
  <main class="leaf chart-screen">
    <header class="class-head">
      <p class="wordmark">Bhava</p>
      <h1>${r.cls.name}</h1>
      <p class="lead">${r.timeKnown ? 'Your lagna is' : 'Read from your Moon in'} ${lagnaName}, ruled by ${r.cls.ruler}. ${r.cls.style}</p>
      ${r.timeKnown ? '' : '<p class="note">Without a birth time, your houses are read from the Moon. Add the time if you can find it.</p>'}
    </header>
    <figure class="chart-wrap">${chartSvg(r)}
      <figcaption>Born ${esc(local)}${r.timeKnown ? '' : ' (time unknown)'}, ${esc(placeLabel(r.birth.place))}, ${r.offset}</figcaption>
    </figure>
    <section class="houses" aria-label="Your twelve houses">
      <h2>Your twelve houses</h2>
      <p class="hint">Tap a house on the chart to find it here.</p>
      <ol>${r.houses.map(h => houseRow(r, h.n)).join('')}</ol>
    </section>
    <footer class="actions">
      <button class="ghost" id="edit">Change my birth</button>
      <button class="link" id="forget">Forget my birth on this phone</button>
    </footer>
  </main>`;

  const jump = (n: number) => {
    const row = document.getElementById(`h-${n}`)!;
    row.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
  };
  app.querySelectorAll<SVGGElement>('.house').forEach(g => {
    g.addEventListener('click', () => jump(+g.dataset.house!));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(+g.dataset.house!); } });
  });
  document.getElementById('edit')!.addEventListener('click', () => showBirth(r.birth));
  document.getElementById('forget')!.addEventListener('click', async () => { await forgetBirth(); showBirth(null); });
  window.scrollTo(0, 0);
}

/* ---------- start ---------- */
loadBirth().then(b => (b ? showChart(castChart(b)) : showBirth(null)));
