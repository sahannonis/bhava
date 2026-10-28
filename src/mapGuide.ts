/* The guide on the chart screen, shown once after the first reading (and again from settings).
   A lit ring moves over each part of the screen with a few plain words; the page stays live under it,
   so the player taps a real house when asked. Skippable at any step. */
import type { Reading } from './seed';
import { getSettings, setSetting } from './settings';
import { sfx } from './sound';

type Step = { at: string; text: string; wait?: 'house' };

export function mapGuideWanted(): boolean { return !getSettings().mapGuideDone; }

export function startMapGuide(r: Reading): void {
  if (document.querySelector('.tour')) return;
  const steps: Step[] = [
    { at: '.class-head', text: `This is you: ${r.cls.name}. Your class comes from ${r.timeKnown ? 'your rising sign' : 'your Moon sign'}, and it gives you a gift in every fight. ${r.cls.style}` },
    { at: '#map', text: 'Your chart is the map. Each shape is one of the twelve houses of your life, and you walk them in order, from the 1st to the 12th. The planets in a house are what you face there. Try it: tap any house.', wait: 'house' },
    { at: '#panel', text: 'This is what waits in that house: its ground, its foes, or a rest place. Clear a house in a run and its reading opens.' },
    { at: '.sky', text: "Today's sky changes every day: where the Moon is for you, and how today touches your runs. Come back tomorrow and it will be different." },
    { at: '#begin', text: 'When you are ready, begin your run here. Your first fight has its own short guide.' },
    { at: '.book-links', text: 'Your books. The Journal keeps every reading you open, the Book of the Sky explains the chart as you meet it, and your matches and life timeline are here too.' },
  ];
  let i = 0;
  const tour = document.createElement('div');
  tour.className = 'tour';
  tour.innerHTML = `<div class="coach-ring"></div><div class="coach-box tour-box" role="dialog" aria-live="polite" aria-label="Guide to the chart">
      <p class="coach-text"></p>
      <div class="coach-actions"><button class="link" id="tourSkip" data-close>Skip the guide</button><span class="tour-n"></span><button class="ghost" id="tourNext">Next</button></div>
    </div>`;
  document.body.appendChild(tour);
  const ring = tour.querySelector<HTMLElement>('.coach-ring')!, box = tour.querySelector<HTMLElement>('.tour-box')!;
  const next = tour.querySelector<HTMLButtonElement>('#tourNext')!;

  const target = () => document.querySelector<HTMLElement>(steps[i].at);
  function place() {
    const el = target();
    if (!el) return;
    const r = el.getBoundingClientRect(), pad = 8, vh = innerHeight;
    Object.assign(ring.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    const below = r.top + r.height / 2 < vh / 2;
    const bh = box.offsetHeight;
    let top = below ? r.bottom + 18 : r.top - 18 - bh;
    top = Math.max(12, Math.min(vh - bh - 12, top)); // stay on screen even beside a tall target
    box.style.top = `${top}px`;
  }
  function show() {
    if (i >= steps.length) return end();
    const el = target();
    if (!el) { i++; return show(); }
    const st = steps[i];
    tour.querySelector('.coach-text')!.textContent = st.text;
    tour.querySelector('.tour-n')!.textContent = `${i + 1} of ${steps.length}`;
    next.hidden = !!st.wait;
    next.textContent = i === steps.length - 1 ? 'Done' : 'Next';
    tour.classList.toggle('waiting', !!st.wait);
    el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    place();
    setTimeout(place, 420); // again once the scroll has settled
  }
  function end() {
    setSetting('mapGuideDone', true);
    tour.remove();
    removeEventListener('scroll', place);
    removeEventListener('resize', place);
    document.removeEventListener('click', onHouse, true);
  }
  // the house step waits for a real tap on the chart
  function onHouse(e: Event) {
    if (!tour.isConnected) return;
    if (steps[i]?.wait === 'house' && (e.target as Element).closest('#map [data-house]')) {
      i++; setTimeout(show, 260);
    }
  }
  document.addEventListener('click', onHouse, true);
  addEventListener('scroll', place, { passive: true });
  addEventListener('resize', place);
  next.addEventListener('click', () => { sfx('tap'); i++; show(); });
  tour.querySelector('#tourSkip')!.addEventListener('click', end);
  show();
}

/* "Begin your run" also floats at the bottom of the chart screen until you scroll down to the real one. */
export function floatBegin(main: HTMLElement): void {
  const begin = main.querySelector<HTMLButtonElement>('#begin');
  if (!begin || !('IntersectionObserver' in window)) return;
  const bar = document.createElement('div');
  bar.className = 'begin-float';
  bar.innerHTML = `<button class="primary">${begin.textContent}</button>`;
  bar.hidden = true;
  main.appendChild(bar);
  bar.querySelector('button')!.addEventListener('click', () => begin.click());
  new IntersectionObserver(([en]) => {
    // shown while the real button is still further down the page
    bar.hidden = en.isIntersecting || en.boundingClientRect.top < 0;
  }).observe(begin);
}
