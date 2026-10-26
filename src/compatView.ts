/* Compatibility: the people you add (kept on this phone) and the 36-point match with each.
   Free: one person, with the score and what it means overall. Full reading: up to four, with every part explained. */
import type { Birth, Reading } from './seed';
import { castChart } from './seed';
import { ashtakoota, band } from './readings/compat';
import { porondam, porondamBand, sideOf, kujaDosha } from './readings/porondam';
import { NAKSHATRAS, nakOf } from './readings/nakshatras';
import { SIGNS } from './readings/signs';
import { DISCLAIMER } from './readings';
import { birthFormHtml, wireBirthForm } from './birthForm';
import { ownsFull, openFullSheet, unlockLabel } from './purchase';
import { sfx } from './sound';
import { buzz } from './haptics';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export type Person = { id: string; name: string; birth: Birth; bride?: 'me' | 'them' };
const KEY = 'bhava.people';
export const FREE_PEOPLE = 1, MAX_PEOPLE = 4;

export function loadPeople(): Person[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function savePeople(p: Person[]): void { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* session only */ } }

const moonOf = (r: Reading) => ({ sign: r.chart.by.Moon.sign, lon: r.chart.by.Moon.lon });
type System = 'porondam' | 'koota';
/* Sri Lankan players see porondam first; everyone else the 36-point match. Both are always one tap away. */
const defaultSystem = (me: Reading): System => (me.birth.place.country === 'Sri Lanka' ? 'porondam' : 'koota');
function porondamFor(me: Reading, p: Person, them: Reading) {
  const mine = sideOf(me), theirs = sideOf(them);
  return (p.bride ?? 'them') === 'me' ? porondam(mine, theirs) : porondam(theirs, mine);
}
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function showCompat(root: HTMLElement, me: Reading, back: () => void): void {
  const people = loadPeople(), full = ownsFull(), cap = full ? MAX_PEOPLE : FREE_PEOPLE;
  root.innerHTML = `<main class="leaf run-page compat">
    <p class="wordmark">Porondam and the 36-point match</p>
    <h1 class="house-title">Compatibility</h1>
    <p class="lead">Add the people close to you, and see how your birth stars meet: by porondam, the Sri Lankan match of ten points, and by Ashtakoota, the 36-point match used across India.</p>
    <ul class="journal-list">${people.map(p => {
      const them = castChart(p.birth), sys = defaultSystem(me);
      const t = ashtakoota(moonOf(me), moonOf(them)).total, po = porondamFor(me, p, them).score;
      const label = sys === 'porondam' ? `${fmt(po)} of 10 porondam · ${fmt(t)} of 36` : `${fmt(t)} of 36 · ${fmt(po)} of 10 porondam`;
      return `<li><button class="journal-row" data-person="${p.id}"><span class="j-n">${sys === 'porondam' ? fmt(po) : fmt(t)}</span><span class="j-t"><b>${esc(p.name)}</b><small>${label}</small></span></button></li>`;
    }).join('')}</ul>
    ${people.length < cap ? '<button class="primary" id="add">Add someone</button>'
      : people.length < MAX_PEOPLE ? `<div class="locked-card"><p>With the Full reading you can add up to ${MAX_PEOPLE} people, and every match is explained part by part.</p><button class="primary" id="unlockFull">${unlockLabel()}</button></div>`
      : `<p class="hint">You have added ${MAX_PEOPLE} people, the most this phone keeps. Remove one to add another.</p>`}
    <p class="disclaimer">${DISCLAIMER}</p>
    <div class="run-actions"><button class="link" id="back">Back to your chart</button></div>
  </main>`;
  window.scrollTo(0, 0);
  const again = () => showCompat(root, me, back);
  root.querySelector('#add')?.addEventListener('click', () => { sfx('tap'); addPerson(root, me, again); });
  root.querySelector('#unlockFull')?.addEventListener('click', () => openFullSheet(() => again()));
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

function showMatch(root: HTMLElement, me: Reading, p: Person, back: () => void, sys: System = defaultSystem(me)): void {
  const them = castChart(p.birth), a = moonOf(me), b = moonOf(them), full = ownsFull();
  const na = NAKSHATRAS[nakOf(a.lon)].name, nb = NAKSHATRAS[nakOf(b.lon)].name;
  const unlock = `<div class="locked-card"><p>What each point says about the two of you comes with the Full reading.</p><button class="primary" id="unlockFull">${unlockLabel()}</button></div>`;
  let score = 0, max = 36, head = { name: '', text: '' }, body = '';
  if (sys === 'koota') {
    const { kootas, total } = ashtakoota(a, b), doshas = kootas.filter(k => (k.id === 'nadi' || k.id === 'bhakoot') && k.score === 0);
    score = total; head = band(total);
    body = `<ul class="kootas${full ? '' : ' locked'}">${kootas.map(k => `<li>
        <div class="koota-top"><b>${esc(k.name)}</b><span>${fmt(k.score)} / ${k.max}</span></div>
        <div class="koota-bar"><i style="width:${(k.score / k.max) * 100}%"></i></div>
        ${full ? `<p>${esc(k.text)}</p>` : ''}
      </li>`).join('')}</ul>
      ${full ? (doshas.length ? `<p class="dosha">${doshas.map(d => d.id === 'nadi' ? 'Nadi dosha is present.' : 'Bhakoot dosha is present.').join(' ')} Tradition often weighs these against the rest of both charts, and many astrologers say they are cancelled when the Moon signs share a lord or the total is high. Treat them as places to be careful, not as a closed door.</p>` : '') : unlock}
      <p class="note">Read without gender: where the old rules score bride and groom differently, this takes the kinder score.</p>`;
  } else {
    const po = porondamFor(me, p, them), ok = po.points.filter(x => x.essential).every(x => x.result !== 'no');
    score = po.score; max = 10; head = porondamBand(po.score, ok);
    const km = kujaDosha(me), kt = kujaDosha(them);
    const kuja = km.has === kt.has ? `Kuja dosha: ${km.has ? 'both charts carry it, so they balance each other' : 'neither chart carries it'}.`
      : `Kuja dosha: ${km.has ? 'your chart carries it' : `${esc(p.name)}'s chart carries it`} (Mars in a sensitive house from ${(km.has ? km : kt).from.join(' and ')}) and the other does not. Tradition looks for both or neither, and many placements soften it; an astrologer weighs this with the whole charts.`;
    const bride = p.bride ?? 'them';
    body = `<div class="bride-pick" role="group" aria-label="Whose star counts as the bride's">
        <span>Porondam counts from the bride's star:</span>
        <button class="mode" data-bride="me" aria-pressed="${bride === 'me'}">Mine</button>
        <button class="mode" data-bride="them" aria-pressed="${bride === 'them'}">${esc(p.name)}'s</button>
      </div>
      <ul class="porondam${full ? '' : ' locked'}">${po.points.map(x => `<li class="po-${x.result}">
        <span class="po-mark" aria-label="${x.result === 'yes' ? 'obtained' : x.result === 'half' ? 'partly obtained' : 'not obtained'}">${x.result === 'yes' ? '●' : x.result === 'half' ? '◐' : '○'}</span>
        <div><b>${esc(x.name)}${x.essential ? ' <small>essential</small>' : ''}</b>${full ? `<p>${esc(x.text)}</p>` : ''}</div>
      </li>`).join('')}</ul>
      ${full ? `<p class="dosha${km.has === kt.has ? ' calm' : ''}">${kuja}</p>` : unlock}`;
  }
  root.innerHTML = `<main class="leaf run-page compat">
    <p class="wordmark">You and ${esc(p.name)}</p>
    <div class="modes" role="group" aria-label="Which match">
      <button type="button" class="mode" data-sys="porondam" aria-pressed="${sys === 'porondam'}">Porondam</button>
      <button type="button" class="mode" data-sys="koota" aria-pressed="${sys === 'koota'}">36 points</button>
    </div>
    <div class="match-head">
      <div><small>Your Moon</small><b>${SIGNS[a.sign]}</b><small>${na}</small></div>
      <div class="match-score" style="--p:${(score / max) * 100}%"><b>${fmt(score)}</b><small>of ${max}</small></div>
      <div><small>${esc(p.name)}'s Moon</small><b>${SIGNS[b.sign]}</b><small>${nb}</small></div>
    </div>
    <h1 class="house-title">${head.name}</h1>
    <p class="lead">${head.text}</p>
    ${body}
    <p class="disclaimer">${DISCLAIMER} A table of stars cannot measure love; it can only start a conversation.</p>
    <div class="run-actions"><button class="link" id="back">Back</button><button class="link" id="remove">Remove ${esc(p.name)}</button></div>
  </main>`;
  window.scrollTo(0, 0);
  const again = (s = sys) => showMatch(root, me, p, back, s);
  root.querySelectorAll<HTMLElement>('[data-sys]').forEach(el => el.addEventListener('click', () => { sfx('tap'); again(el.dataset.sys as System); }));
  root.querySelectorAll<HTMLElement>('[data-bride]').forEach(el => el.addEventListener('click', () => {
    p.bride = el.dataset.bride as 'me' | 'them';
    savePeople(loadPeople().map(x => (x.id === p.id ? { ...x, bride: p.bride } : x)));
    sfx('tap'); again();
  }));
  root.querySelector('#unlockFull')?.addEventListener('click', () => openFullSheet(() => again()));
  root.querySelector('#back')!.addEventListener('click', back);
  root.querySelector('#remove')!.addEventListener('click', e => {
    const btn = e.target as HTMLButtonElement;
    if (!btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = 'Tap again to remove'; return; }
    savePeople(loadPeople().filter(x => x.id !== p.id)); back();
  });
}
