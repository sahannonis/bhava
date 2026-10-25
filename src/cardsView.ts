/* Cards shown outside a fight (rewards, the stall, your deck), and a picker for choosing one. */
import { CARDS, cardText } from './game/cards';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const ICON_BLADE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 L14 10 M14 10 L19 4 L20 5 L15 11 Z M6 15 L9 18 M3 21 L5 19" /></svg>';
const ICON_SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L19 6 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V6 Z" /></svg>';

export function cardFace(id: string, extra = '', attrs = ''): string {
  const d = CARDS[id];
  return `<button type="button" class="card face ${d.type}${d.planet ? ` planet-${d.planet.toLowerCase()}` : ''}${id.endsWith('+') ? ' upgraded' : ''} ${extra}" ${attrs}
      aria-label="${esc(d.name)}, costs ${d.cost} breath. ${esc(cardText(d))}">
    <span class="cost">${d.cost}</span>
    <span class="card-name">${esc(d.name)}</span>
    <span class="card-kind">${d.type === 'attack' ? ICON_BLADE : ICON_SHIELD}</span>
    <span class="card-text">${esc(cardText(d))}</span>
    ${d.planet ? `<span class="seal">${d.planet.slice(0, 2)}</span>` : ''}
  </button>`;
}

/* A sheet over the page listing cards to choose from. Resolves with the index chosen, or null. */
export function pickCard(title: string, ids: string[], opts: { note?: string; disabled?: (id: string) => boolean } = {}): Promise<number | null> {
  return new Promise(resolve => {
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="sheet-head"><h2>${esc(title)}</h2><button class="link" data-close>Cancel</button></div>
        ${opts.note ? `<p class="note">${esc(opts.note)}</p>` : ''}
        <div class="card-grid">${ids.map((id, i) => cardFace(id, opts.disabled?.(id) ? 'dim' : '', `data-i="${i}"`)).join('')}</div>
      </div>`;
    document.body.appendChild(sheet);
    const done = (v: number | null) => { sheet.remove(); resolve(v); };
    sheet.addEventListener('click', e => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-close]') || t === sheet) return done(null);
      const c = t.closest<HTMLElement>('[data-i]');
      if (c && !c.classList.contains('dim')) done(+c.dataset.i!);
    });
  });
}
