/* A small birth form (date, time, place) for adding someone else's chart, on the phone only. */
import { findPlaces, loadPlaces, placeFromCoords, placeLabel, type Place } from './places';
import type { Birth } from './seed';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const today = () => new Date().toISOString().slice(0, 10);

export function birthFormHtml(submitLabel: string, withName = true): string {
  return `<form id="bf" class="birth-form" novalidate>
    ${withName ? `<label class="field"><span>Their name</span><input id="bfName" type="text" maxlength="30" autocomplete="off" placeholder="So you know whose chart it is" /></label>` : ''}
    <label class="field"><span>Date of birth</span><input id="bfDate" type="date" min="1900-01-01" max="${today()}" required /></label>
    <label class="field"><span>Time of birth</span><input id="bfTime" type="time" /><small>Leave it blank if unknown. The match only needs the Moon, so a missing time rarely changes it.</small></label>
    <div class="field">
      <label for="bfQ">Place of birth</label>
      <div id="bfChosen" class="chosen" hidden><span id="bfPlace"></span><button type="button" class="link" id="bfChange">Change</button></div>
      <div id="bfPick">
        <input id="bfQ" type="search" autocomplete="off" placeholder="Town or city" />
        <ul id="bfList" class="suggest" role="listbox"></ul>
        <small id="bfState">Loading places…</small>
        <button type="button" class="link" id="bfCoordsOpen">Can't find it? Enter map coordinates</button>
        <div id="bfCoordsBox" hidden><input id="bfCoords" type="text" inputmode="decimal" placeholder="e.g. 6.927, 79.861" /><button type="button" class="ghost" id="bfCoordsUse">Use these</button></div>
      </div>
    </div>
    <p id="bfErr" class="err" role="alert"></p>
    <button class="primary" type="submit">${esc(submitLabel)}</button>
    <p class="private">Their birth stays on this phone. Nothing is sent anywhere.</p>
  </form>`;
}

export function wireBirthForm(root: HTMLElement, done: (b: Birth, name: string) => void): void {
  const $ = <T extends HTMLElement>(id: string) => root.querySelector('#' + id) as T;
  const q = $<HTMLInputElement>('bfQ'), list = $<HTMLUListElement>('bfList'), state = $('bfState');
  let place: Place | null = null, matches: Place[] = [];
  const choose = (p: Place | null) => {
    place = p; $('bfChosen').hidden = !p; $('bfPick').hidden = !!p;
    if (p) $('bfPlace').textContent = placeLabel(p);
    list.innerHTML = '';
  };
  const render = () => {
    matches = findPlaces(q.value);
    list.innerHTML = matches.map((p, i) => `<li role="option" data-i="${i}"><b>${esc(p.name)}</b> <span>${esc([p.prov, p.country].filter(x => x && x !== p.name).join(', '))}</span></li>`).join('');
    if (q.value.trim().length >= 2 && !matches.length) state.textContent = 'No match yet. Try the nearest town, or map coordinates.';
    else if (matches.length) state.textContent = '';
  };
  loadPlaces().then(() => { state.textContent = ''; if (q.value) render(); }).catch(() => { state.textContent = 'The place list could not load. Use map coordinates below.'; });
  let t = 0;
  q.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(render, 120); });
  list.addEventListener('click', e => { const li = (e.target as HTMLElement).closest('li'); if (li) choose(matches[+li.dataset.i!]); });
  $('bfChange').addEventListener('click', () => { choose(null); q.focus(); });
  $('bfCoordsOpen').addEventListener('click', () => { $('bfCoordsBox').hidden = false; });
  $('bfCoordsUse').addEventListener('click', () => {
    const p = placeFromCoords($<HTMLInputElement>('bfCoords').value);
    $('bfErr').textContent = p ? '' : 'Those coordinates were not understood. Paste them like 6.927, 79.861.';
    if (p) choose(p);
  });
  $('bf').addEventListener('submit', e => {
    e.preventDefault();
    const name = root.querySelector<HTMLInputElement>('#bfName')?.value.trim() || 'Someone';
    const date = $<HTMLInputElement>('bfDate').value, time = $<HTMLInputElement>('bfTime').value || null, err = $('bfErr');
    if (!date) { err.textContent = 'Enter their date of birth.'; return; }
    if (date > today()) { err.textContent = 'That date is in the future.'; return; }
    if (!place) { err.textContent = 'Pick their place of birth from the list.'; return; }
    done({ date, time, place }, name);
  });
}
