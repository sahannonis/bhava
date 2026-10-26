/* Your dasha timeline: the planet periods of a whole life, with years and ages, where you are now,
   and the shorter chapters inside each. Part of the Full reading; the current chapter is free in the first reading. */
import type { Reading } from './seed';
import { dashaTimeline, DISCLAIMER } from './readings';
import { ownsFull, openFullSheet, unlockLabel } from './purchase';
import { sfx } from './sound';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const my = (ms: number) => new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(new Date(ms));

export function showTimeline(root: HTMLElement, r: Reading, back: () => void): void {
  const full = ownsFull(), list = dashaTimeline(r);
  const span = list[list.length - 1].end - list[0].start;
  root.innerHTML = `<main class="leaf run-page timeline">
    <p class="wordmark">Vimshottari dasha</p>
    <h1 class="house-title">Your timeline</h1>
    <p class="lead">Your life moves through nine planet periods, in an order set by the star your Moon was born under. Each brings its planet's matters, and the houses it rules in your chart, to the front.</p>
    <div class="time-strip" aria-hidden="true">${list.map(p => `<i class="pl-bg-${p.lord.toLowerCase()}${p.now ? ' now' : ''}" style="flex:${(p.end - p.start) / span}"></i>`).join('')}</div>
    <ol class="periods">${list.map((p, i) => {
      const open = full || p.now;
      return `<li class="period${p.now ? ' now' : ''}${p.past ? ' past' : ''}">
        <button class="period-head" data-i="${i}" ${open ? '' : 'disabled'}>
          <span class="pl-${p.lord.toLowerCase()}">${p.lord}</span>
          <small>${p.from}–${p.to} · age ${p.ageFrom}–${p.ageTo}${p.now ? ' · now' : ''}</small>
        </button>
        <div class="period-body" hidden>
          <p>${esc(p.text)}</p>
          <p class="yours">${esc(p.yours)}</p>
          <ul class="subs">${p.sub.map(s => `<li class="${s.now ? 'now' : ''}"><b class="pl-${s.lord.toLowerCase()}">${s.lord}</b> ${my(s.start)} – ${my(s.end)} <small>${esc(s.tone)}</small></li>`).join('')}</ul>
        </div>
      </li>`;
    }).join('')}</ol>
    ${full ? '' : `<div class="locked-card"><p>Your current chapter is open. Every period of your life, with its chapters month by month and what each means in your own chart, comes with the Full reading.</p><button class="primary" id="unlockFull">${unlockLabel()}</button></div>`}
    <p class="disclaimer">${DISCLAIMER}</p>
    <div class="run-actions"><button class="link" id="back">Back</button></div>
  </main>`;
  window.scrollTo(0, 0);
  root.querySelectorAll<HTMLElement>('.period-head').forEach(el => el.addEventListener('click', () => {
    const body = el.nextElementSibling as HTMLElement; body.hidden = !body.hidden; sfx('tap');
  }));
  (root.querySelector('.period.now .period-body') as HTMLElement | null)?.removeAttribute('hidden');
  root.querySelector('#unlockFull')?.addEventListener('click', () => openFullSheet(() => showTimeline(root, r, back)));
  root.querySelector('#back')!.addEventListener('click', back);
}
