/* Cards shown outside a fight (rewards, the stall, your deck), and a picker for choosing one. */
import { CARDS, MAX_LEVEL, cardText, levelOf } from './game/cards';

/* Card names get the full top line; the longest word sets the size so nothing spills out. */
export const nameFit = (name: string) => {
  const longest = Math.max(...name.split(' ').map(w => w.length));
  return `font-size:${Math.min(15.2, 66 / (longest * 0.55)).toFixed(1)}px`;
};

/* Level marks on a card: one filled dot per upgrade. */
export const levelPips = (id: string) => { const n = levelOf(id); return n ? `<span class="lvl" aria-label="level ${n + 1}">${'<i></i>'.repeat(n)}${'<i class="off"></i>'.repeat(MAX_LEVEL - n)}</span>` : ''; };

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const ICON_BLADE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 L14 10 M14 10 L19 4 L20 5 L15 11 Z M6 15 L9 18 M3 21 L5 19" /></svg>';
const ICON_SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L19 6 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V6 Z" /></svg>';

export function cardFace(id: string, extra = '', attrs = ''): string {
  const d = CARDS[id];
  return `<button type="button" class="card face ${d.type}${d.planet ? ` planet-${d.planet.toLowerCase()}` : ''}${levelOf(id) ? ' upgraded' : ''} ${extra}" ${attrs}
      aria-label="${esc(d.name)}${levelOf(id) ? `, level ${levelOf(id) + 1}` : ''}, costs ${d.cost} breath. ${esc(cardText(d))}">
    <span class="cost">${d.cost}</span>
    <span class="card-name" style="${nameFit(d.name)}">${esc(d.name)}</span>
    <span class="card-kind">${d.type === 'attack' ? ICON_BLADE : ICON_SHIELD}</span>
    <span class="card-text">${esc(cardText(d))}</span>
    ${d.planet ? `<span class="seal">${d.planet.slice(0, 2)}</span>` : ''}
    ${levelPips(id)}
  </button>`;
}

/* A sheet over the page listing cards to choose from. Resolves with the index chosen, or null. */
export function pickCard(title: string, ids: string[], opts: { note?: string; disabled?: (id: string) => boolean; show?: (id: string) => string; label?: (id: string) => string } = {}): Promise<number | null> {
  return new Promise(resolve => {
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="sheet-head"><h2>${esc(title)}</h2><button class="link" data-close>Cancel</button></div>
        ${opts.note ? `<p class="note">${esc(opts.note)}</p>` : ''}
        <div class="card-grid">${ids.map((id, i) => {
          const face = cardFace(opts.show && !opts.disabled?.(id) ? opts.show(id) : id, opts.disabled?.(id) ? 'dim' : '', `data-i="${i}"`);
          return opts.label ? `<div class="for-sale">${face}<span class="price">${esc(opts.label(id))}</span></div>` : face;
        }).join('')}</div>
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

/* A sheet that just shows cards: your deck, or a fight's draw or discard pile. */
export function viewCards(title: string, ids: string[], note = ''): void {
  const sorted = [...ids].sort((a, b) => {
    const A = CARDS[a], B = CARDS[b];
    return (A.type === B.type ? 0 : A.type === 'attack' ? -1 : 1) || A.cost - B.cost || A.name.localeCompare(B.name) || levelOf(b) - levelOf(a);
  });
  const attacks = ids.filter(id => CARDS[id].type === 'attack').length, raised = ids.filter(id => levelOf(id) > 0).length;
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.innerHTML = `<div class="sheet-card deck-view" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-head"><h2>${esc(title)}</h2><button class="link" data-close>Close</button></div>
      <p class="note">${ids.length} card${ids.length === 1 ? '' : 's'} · ${attacks} attack${attacks === 1 ? '' : 's'} · ${ids.length - attacks} skill${ids.length - attacks === 1 ? '' : 's'}${raised ? ` · ${raised} raised` : ''}${note ? `. ${esc(note)}` : ''}</p>
      ${ids.length ? `<div class="card-grid">${sorted.map(id => cardFace(id, 'view')).join('')}</div>` : '<p class="hint">No cards here.</p>'}
    </div>`;
  document.body.appendChild(sheet);
  sheet.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-close]') || t === sheet) sheet.remove();
  });
}
