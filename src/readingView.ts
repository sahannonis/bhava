/* Showing a reading, and the fading preview when it needs the Full reading. */
import type { ReadingText } from './readings';
import { DISCLAIMER } from './readings';
import { ownsFull, openFullForTest, TEST_BUILD } from './purchase';
import { sfx } from './sound';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function readingHtml(rt: ReadingText, locked = false): string {
  const parts = rt.sections.map((s, i) => {
    const cls = `read-part${s.planet ? ` pl-${s.planet.toLowerCase()}` : ''}${locked && i === 1 ? ' fading' : ''}`;
    return `<section class="${cls}"><h2>${esc(s.heading)}</h2><p>${esc(s.text)}</p></section>`;
  });
  const shown = locked ? parts.slice(0, 2) : parts;
  return `<div class="reading-body">${shown.join('')}</div>
    ${locked ? `<div class="locked-card">
        <p class="wordmark">The Full reading</p>
        <p>The rest of this reading, and every house from the 5th to the 12th, comes with the Full reading: your whole-chart reading and dasha timeline, compatibility with the people close to you, and the ad rewards with no ads. One payment, no subscription.</p>
        <button class="primary" id="unlockFull">${TEST_BUILD ? 'Open it (free in this test build)' : 'Open the Full reading'}</button>
      </div>` : ''}
    <p class="disclaimer">${DISCLAIMER}</p>`;
}

/* A full page for one reading. `free` readings never lock. */
export function showReading(root: HTMLElement, rt: ReadingText, o: { free: boolean; back: () => void; backLabel?: string }): void {
  const locked = !o.free && !ownsFull();
  root.innerHTML = `<main class="leaf run-page reading">
    <p class="wordmark">${esc(rt.subtitle)}</p>
    <h1 class="house-title">${esc(rt.title)}</h1>
    ${readingHtml(rt, locked)}
    <div class="run-actions"><button class="link" id="readBack">${esc(o.backLabel ?? 'Back')}</button></div>
  </main>`;
  window.scrollTo(0, 0);
  root.querySelector('#unlockFull')?.addEventListener('click', () => { openFullForTest(); sfx('yoga'); showReading(root, rt, o); });
  root.querySelector('#readBack')!.addEventListener('click', o.back);
}

/* A small note that slides in when new pages open in the Book of the Sky. */
export function pageNote(names: string[]): void {
  if (!names.length) return;
  const el = document.createElement('div');
  el.className = 'page-note';
  el.setAttribute('role', 'status');
  el.innerHTML = `<b>New in the Book of the Sky</b><span>${names.map(esc).join(', ')}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3800);
}
