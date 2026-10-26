/* The Journal: every reading you have opened, kept forever. Dying ends a run, never a reading. */
import type { Reading } from './seed';
import { ordinal } from './seed';
import { firstReading, houseReading, wholeChartReading, FREE_HOUSES, DISCLAIMER } from './readings';
import { showTimeline } from './timelineView';
import { HOUSE_MEANING } from './readings/houses';
import { showReading } from './readingView';
import { loadCleared } from './runStore';
import { ownsFull } from './purchase';
import { sfx } from './sound';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function showJournal(root: HTMLElement, r: Reading, back: () => void): void {
  const cleared = new Set(loadCleared()), full = ownsFull();
  const rows = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1, open = cleared.has(n), paid = n > FREE_HOUSES && !full;
    return `<li><button class="journal-row${open ? '' : ' shut'}" data-house="${n}" ${open ? '' : 'disabled'}>
      <span class="j-n">${n}</span>
      <span class="j-t"><b>The ${ordinal(n)} house</b><small>${esc(HOUSE_MEANING[i].short)}${open ? (paid ? ' · opening lines' : '') : ` · clear it to read`}</small></span>
      ${open && paid ? '<span class="j-lock" aria-label="Full reading">◆</span>' : ''}
    </button></li>`;
  }).join('');
  root.innerHTML = `<main class="leaf run-page journal">
    <p class="wordmark">Kept forever</p>
    <h1 class="house-title">Your Journal</h1>
    <p class="lead">Each house you clear opens its reading here. Clear all twelve, across any runs, and the whole chart is read.</p>
    <ul class="journal-list">
      <li><button class="journal-row" id="first"><span class="j-n">✦</span><span class="j-t"><b>Your first reading</b><small>Your lagna and your Moon</small></span></button></li>
      ${rows}
      <li><button class="journal-row${cleared.size === 12 ? '' : ' shut'}" id="whole" ${cleared.size === 12 ? '' : 'disabled'}><span class="j-n">☉</span><span class="j-t"><b>The whole chart</b><small>${cleared.size === 12 ? (full ? 'All twelve houses, read together' : 'Opening lines · the rest with the Full reading') : `${cleared.size} of 12 houses cleared`}</small></span></button></li>
      <li><button class="journal-row" id="timeline"><span class="j-n">◷</span><span class="j-t"><b>Your dasha timeline</b><small>${full ? 'Every period of your life' : 'Your current chapter · the rest with the Full reading'}</small></span></button></li>
    </ul>
    <p class="disclaimer">${DISCLAIMER}</p>
    <div class="run-actions"><button class="link" id="back">Back to your chart</button></div>
  </main>`;
  window.scrollTo(0, 0);
  const again = () => showJournal(root, r, back);
  root.querySelector('#first')!.addEventListener('click', () => { sfx('tap'); showReading(root, firstReading(r), { free: true, back: again, backLabel: 'Back to the Journal' }); });
  root.querySelectorAll<HTMLElement>('[data-house]').forEach(el => el.addEventListener('click', () => {
    const n = +el.dataset.house!; sfx('tap');
    showReading(root, houseReading(r, n), { free: n <= FREE_HOUSES, back: again, backLabel: 'Back to the Journal' });
  }));
  root.querySelector('#whole')?.addEventListener('click', () => { sfx('tap'); showReading(root, wholeChartReading(r), { free: false, back: again, backLabel: 'Back to the Journal' }); });
  root.querySelector('#timeline')!.addEventListener('click', () => { sfx('tap'); showTimeline(root, r, again); });
  root.querySelector('#back')!.addEventListener('click', back);
}
