/* Compatibility: the people you add (kept on this phone) and the 36-point match with each.
   Free: one person, with the score and what it means overall. Full reading: up to four, with every part explained. */
import type { Birth, Reading } from './seed';
import { castChart } from './seed';
import { ashtakoota, band } from './readings/compat';
import { NAKSHATRAS, nakOf } from './readings/nakshatras';
import { SIGNS } from './readings/signs';
import { DISCLAIMER } from './readings';
import { birthFormHtml, wireBirthForm } from './birthForm';
import { ownsFull, openFullForTest, TEST_BUILD } from './purchase';
import { sfx } from './sound';
import { buzz } from './haptics';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export type Person = { id: string; name: string; birth: Birth };
const KEY = 'bhava.people';
export const FREE_PEOPLE = 1, MAX_PEOPLE = 4;

export function loadPeople(): Person[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function savePeople(p: Person[]): void { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* session only */ } }

const moonOf = (r: Reading) => ({ sign: r.chart.by.Moon.sign, lon: r.chart.by.Moon.lon });

export function showCompat(root: HTMLElement, me: Reading, back: () => void): void {
  const people = loadPeople(), full = ownsFull(), cap = full ? MAX_PEOPLE : FREE_PEOPLE;
  root.innerHTML = `<main class="leaf run-page compat">
    <p class="wordmark">The 36-point match</p>
    <h1 class="house-title">Compatibility</h1>
    <p class="lead">Add the people close to you, and see how your birth Moons meet by Ashtakoota, the match families in Sri Lanka and India still use: eight parts, 36 points.</p>
    <ul class="journal-list">${people.map(p => {
      const t = ashtakoota(moonOf(me), moonOf(castChart(p.birth))).total;
      return `<li><button class="journal-row" data-person="${p.id}"><span class="j-n">${t}</span><span class="j-t"><b>${esc(p.name)}</b><small>${band(t).name}, ${t} of 36</small></span></button></li>`;
    }).join('')}</ul>
    ${people.length < cap ? '<button class="primary" id="add">Add someone</button>'
      : people.length < MAX_PEOPLE ? `<div class="locked-card"><p>With the Full reading you can add up to ${MAX_PEOPLE} people, and every match is explained part by part.</p><button class="primary" id="unlockFull">${TEST_BUILD ? 'Open it (free in this test build)' : 'Open the Full reading'}</button></div>`
      : `<p class="hint">You have added ${MAX_PEOPLE} people, the most this phone keeps. Remove one to add another.</p>`}
    <p class="disclaimer">${DISCLAIMER}</p>
    <div class="run-actions"><button class="link" id="back">Back to your chart</button></div>
  </main>`;
  window.scrollTo(0, 0);
  const again = () => showCompat(root, me, back);
  root.querySelector('#add')?.addEventListener('click', () => { sfx('tap'); addPerson(root, me, again); });
  root.querySelector('#unlockFull')?.addEventListener('click', () => { openFullForTest(); sfx('yoga'); again(); });
  root.querySelectorAll<HTMLElement>('[data-person]').forEach(el => el.addEventListener('click', () => { sfx('tap'); showMatch(root, me, people.find(p => p.id === el.dataset.person)!, again); }));
  root.querySelector('#back')!.addEventListener('click', back);
}

function addPerson(root: HTMLElement, me: Reading, back: () => void): void {
  root.innerHTML = `<main class="leaf run-page">
    <p class="wordmark">Compatibility</p>
    <h1 class="house-title">Add someone</h1>
    ${birthFormHtml('See the match')}
    <div class="run-actions"><button class="link" id="back">Back</button></div>
  </main>`;
  window.scrollTo(0, 0);
  wireBirthForm(root, (birth, name) => {
    const p: Person = { id: String(Date.now()), name, birth };
    savePeople([...loadPeople(), p]);
    buzz('yoga');
    showMatch(root, me, p, back);
  });
  root.querySelector('#back')!.addEventListener('click', back);
}

function showMatch(root: HTMLElement, me: Reading, p: Person, back: () => void): void {
  const them = castChart(p.birth), a = moonOf(me), b = moonOf(them);
  const { kootas, total } = ashtakoota(a, b), bd = band(total), full = ownsFull();
  const na = NAKSHATRAS[nakOf(a.lon)].name, nb = NAKSHATRAS[nakOf(b.lon)].name;
  const doshas = kootas.filter(k => (k.id === 'nadi' || k.id === 'bhakoot') && k.score === 0);
  root.innerHTML = `<main class="leaf run-page compat">
    <p class="wordmark">You and ${esc(p.name)}</p>
    <div class="match-head">
      <div><small>Your Moon</small><b>${SIGNS[a.sign]}</b><small>${na}</small></div>
      <div class="match-score" style="--p:${(total / 36) * 100}%"><b>${total}</b><small>of 36</small></div>
      <div><small>${esc(p.name)}'s Moon</small><b>${SIGNS[b.sign]}</b><small>${nb}</small></div>
    </div>
    <h1 class="house-title">${bd.name}</h1>
    <p class="lead">${bd.text}</p>
    <ul class="kootas${full ? '' : ' locked'}">${kootas.map(k => `<li>
      <div class="koota-top"><b>${esc(k.name)}</b><span>${k.score} / ${k.max}</span></div>
      <div class="koota-bar"><i style="width:${(k.score / k.max) * 100}%"></i></div>
      ${full ? `<p>${esc(k.text)}</p>` : ''}
    </li>`).join('')}</ul>
    ${full ? (doshas.length ? `<p class="dosha">${doshas.map(d => d.id === 'nadi' ? 'Nadi dosha is present.' : 'Bhakoot dosha is present.').join(' ')} Tradition often weighs these against the rest of both charts, and many astrologers say they are cancelled when the Moon signs share a lord or the total is high. Treat them as places to be careful, not as a closed door.</p>` : '')
      : `<div class="locked-card"><p>What each of the eight parts says about the two of you comes with the Full reading.</p><button class="primary" id="unlockFull">${TEST_BUILD ? 'Open it (free in this test build)' : 'Open the Full reading'}</button></div>`}
    <p class="note">Read without gender: where the old rules score bride and groom differently, this takes the kinder score.</p>
    <p class="disclaimer">${DISCLAIMER} A table of stars cannot measure love; it can only start a conversation.</p>
    <div class="run-actions"><button class="link" id="back">Back</button><button class="link" id="remove">Remove ${esc(p.name)}</button></div>
  </main>`;
  window.scrollTo(0, 0);
  sfx(total >= 18 ? 'heal' : 'status');
  root.querySelector('#unlockFull')?.addEventListener('click', () => { openFullForTest(); sfx('yoga'); showMatch(root, me, p, back); });
  root.querySelector('#back')!.addEventListener('click', back);
  root.querySelector('#remove')!.addEventListener('click', e => {
    const btn = e.target as HTMLButtonElement;
    if (!btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = 'Tap again to remove'; return; }
    savePeople(loadPeople().filter(x => x.id !== p.id)); back();
  });
}
