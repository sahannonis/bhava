/* The Book of the Sky: 42 pages on the planets, houses, signs and yogas. Each page says what it means
   in Jyotisha, then where it sits in your own chart. Pages open as you meet them in play. */
import type { Reading } from './seed';
import { ordinal } from './seed';
import { loadBook, BOOK_SIZE, PART_REWARD } from './book';
import { PLANETS, PLANET_PAGE, PLANET_IN_HOUSE } from './readings/planets';
import { HOUSE_MEANING, HOUSE_NAME } from './readings/houses';
import { SIGNS, SIGN_TEXT, signFacts, YOGA_PAGE, chartYogas } from './readings/signs';
import { FREE_HOUSES, DISCLAIMER, the } from './readings';
import { YOGAS, yogaEffectText } from './game/yogas';
import { loadCleared } from './runStore';
import { ownsFull } from './purchase';
import { sfx } from './sound';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
type Tab = 'planets' | 'houses' | 'signs' | 'yogas';
const TABS: { id: Tab; name: string; hint: string }[] = [
  { id: 'planets', name: 'Planets', hint: 'Fight a planet or play one of its cards' },
  { id: 'houses', name: 'Houses', hint: 'Walk into the house in a run' },
  { id: 'signs', name: 'Signs', hint: 'Walk into a house of this sign' },
  { id: 'yogas', name: 'Yogas', hint: 'Play cards of both planets in one turn' },
];

export function showBook(root: HTMLElement, r: Reading, back: () => void, tab: Tab = 'planets'): void {
  const b = loadBook();
  const have: Record<Tab, Set<string | number>> = { planets: new Set(b.planets), houses: new Set(b.houses), signs: new Set(b.signs), yogas: new Set(b.yogas) };
  const total = b.planets.length + b.houses.length + b.signs.length + b.yogas.length;
  const t = TABS.find(x => x.id === tab)!;
  const items: { id: string | number; label: string; small: string; cls?: string }[] =
    tab === 'planets' ? PLANETS.map(p => ({ id: p, label: p, small: PLANET_PAGE[p].sanskrit, cls: `pl-${p.toLowerCase()}` }))
    : tab === 'houses' ? HOUSE_MEANING.map((h, i) => ({ id: i + 1, label: ordinal(i + 1), small: h.short }))
    : tab === 'signs' ? SIGNS.map((s, i) => ({ id: i, label: s, small: signFacts(i).split(' · ')[0] }))
    : YOGAS.map(y => ({ id: y.id, label: y.name.replace(' Yoga', ''), small: `${y.planets[0]} + ${Array.isArray(y.planets[1]) ? y.planets[1].join('/') : y.planets[1]}` }));

  root.innerHTML = `<main class="leaf run-page book">
    <p class="wordmark">${total} of 42 pages</p>
    <h1 class="house-title">Book of the Sky</h1>
    <p class="lead">What the grahas, bhavas, rashis and yogas mean in Jyotisha, and where each one sits in your own chart. Finish a part for ${PART_REWARD} karma.</p>
    <div class="book-tabs" role="tablist">${TABS.map(x => `<button role="tab" class="book-tab${x.id === tab ? ' on' : ''}" data-tab="${x.id}" aria-selected="${x.id === tab}">${x.name}<small>${have[x.id].size}/${BOOK_SIZE[x.id]}</small></button>`).join('')}</div>
    <div class="book-grid">${items.map(it => have[tab].has(it.id)
      ? `<button class="book-tile ${it.cls ?? ''}" data-page="${it.id}"><b>${esc(it.label)}</b><small>${esc(it.small)}</small></button>`
      : `<div class="book-tile shut"><b>?</b><small>${esc(t.hint)}</small></div>`).join('')}</div>
    <div class="run-actions"><button class="link" id="back">Back to your chart</button></div>
  </main>`;
  window.scrollTo(0, 0);
  root.querySelectorAll<HTMLElement>('[data-tab]').forEach(el => el.addEventListener('click', () => { sfx('tap'); showBook(root, r, back, el.dataset.tab as Tab); }));
  root.querySelectorAll<HTMLElement>('[data-page]').forEach(el => el.addEventListener('click', () => { sfx('tap'); openPage(r, tab, el.dataset.page!); }));
  root.querySelector('#back')!.addEventListener('click', back);
}

/* One page, in a sheet over the book. */
function openPage(r: Reading, tab: Tab, id: string): void {
  const cleared = new Set(loadCleared()), full = ownsFull();
  const canRead = (n: number) => cleared.has(n) && (n <= FREE_HOUSES || full);
  const houseOfSign = (s: number) => ((s - r.lagnaSign + 12) % 12) + 1;
  let title = '', facts = '', meaning = '', yours = '';
  if (tab === 'planets') {
    const p = PLANET_PAGE[id], pos = r.chart.by[id], n = houseOfSign(pos.sign);
    title = `${id} · ${p.sanskrit}`; facts = `Rules ${p.rules}`; meaning = p.text;
    yours = `${the(id, true)} sits in ${SIGNS[pos.sign]}, your ${ordinal(n)} house${pos.dignity && pos.dignity !== 'neutral' ? `, ${pos.dignity}` : ''}${pos.retro && id !== 'Rahu' && id !== 'Ketu' ? ', retrograde' : ''}. `
      + (canRead(n) ? PLANET_IN_HOUSE[id][n - 1] : `Clear your ${ordinal(n)} house to read what this means for you.`);
  } else if (tab === 'houses') {
    const n = +id, h = r.houses[n - 1];
    title = `The ${ordinal(n)} house · ${HOUSE_NAME[n - 1]}`; facts = HOUSE_MEANING[n - 1].short; meaning = HOUSE_MEANING[n - 1].text;
    yours = `Your ${ordinal(n)} house is ${h.signName}, ruled by ${the(h.lord)}, who sits in your ${ordinal(h.lordHouse)}. ${h.planets.length ? `${h.planets.map(p => p.name).join(' and ')} live${h.planets.length === 1 ? 's' : ''} here.` : 'No planet lives here.'} ${canRead(n) ? 'Its full reading is in your Journal.' : `Clear it to read it in your Journal.`}`;
  } else if (tab === 'signs') {
    const s = +id, n = houseOfSign(s), here = r.houses[n - 1].planets.map(p => p.name);
    title = `${SIGNS[s]}`; facts = signFacts(s); meaning = SIGN_TEXT[s];
    yours = `${SIGNS[s]} is your ${ordinal(n)} house${n === 1 && r.timeKnown ? ', your lagna' : ''}.${r.chart.by.Moon.sign === s ? ' Your Moon is here.' : ''} ${here.length ? `It holds ${here.join(' and ')}.` : 'No planet sits in it.'}`;
  } else {
    const y = YOGAS.find(x => x.id === id)!, born = chartYogas(r).includes(id);
    title = y.name; facts = `In the game: ${yogaEffectText(y)}`; meaning = YOGA_PAGE[id];
    yours = born ? 'You were born with this yoga: these planets meet in your own chart.' : 'This yoga is not in your birth chart. You can still form it in a fight.';
  }
  const el = document.createElement('div');
  el.className = 'sheet';
  el.innerHTML = `<div class="sheet-card book-page" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheet-head"><h2>${esc(title)}</h2><button class="link" data-close>Close</button></div>
    <p class="page-facts">${esc(facts)}</p>
    <p>${esc(meaning)}</p>
    <h3>In your chart</h3>
    <p class="yours">${esc(yours)}</p>
    <p class="disclaimer">${DISCLAIMER}</p>
  </div>`;
  document.body.appendChild(el);
  const close = () => el.remove();
  el.querySelector('[data-close]')!.addEventListener('click', close);
  el.addEventListener('click', e => { if (e.target === el) close(); });
}
