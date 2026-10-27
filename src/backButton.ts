/* The phone's back button. Android's default is to close the app; instead it steps back the way
   the screen's own back link would: close a sheet, leave a reading, return to the chart.
   In a fight it asks for a second press, so a stray tap never throws a fight away.
   On the chart (or the birth screen) it sends the app to the background, like other games. */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const visible = (el: Element | null): el is HTMLElement => !!el && (el as HTMLElement).offsetParent !== null;
let armedAt = 0;

function note(text: string) {
  const el = document.createElement('div');
  el.className = 'page-note';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${text}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 1600);
  setTimeout(() => el.remove(), 2100);
}

export function handleBack(): 'handled' | 'exit' {
  // 1. an open sheet (card picker, Full reading, Book page) closes first
  const sheets = document.querySelectorAll<HTMLElement>('.sheet');
  if (sheets.length) {
    const top = sheets[sheets.length - 1];
    const close = top.querySelector<HTMLElement>('[data-close]');
    if (close) close.click(); else top.remove();
    return 'handled';
  }
  // 2. the end-of-fight card: its own button
  const over = document.querySelector<HTMLElement>('.over #back');
  if (visible(over)) { over.click(); return 'handled'; }
  // 3. in a fight: press twice to leave
  const leave = document.querySelector<HTMLElement>('.fight #leave');
  if (visible(leave)) {
    if (Date.now() - armedAt < 2000) { armedAt = 0; leave.click(); }
    else { armedAt = Date.now(); note('Press back again to leave the fight'); }
    return 'handled';
  }
  // 4. any screen's own back link
  for (const sel of ['#readBack', 'button#back', 'button#map']) {
    const b = document.querySelector<HTMLElement>(sel);
    if (visible(b)) { b.click(); return 'handled'; }
  }
  // 5. the chart or the birth screen: leave the app running in the background
  return 'exit';
}

export function initBackButton(): void {
  if (!Capacitor.isNativePlatform()) return;
  void App.addListener('backButton', () => {
    if (handleBack() === 'exit') void App.minimizeApp();
  });
}
