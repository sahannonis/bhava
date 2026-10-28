/* The Full reading: one Google Play purchase, no account, no subscription.
   Owning it is remembered on the phone and checked against Google Play each time the app opens,
   so a refund takes it away and a reinstall gets it back ("Restore purchase").
   In the browser preview there is no store, so the button opens it for free. */
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { sfx } from './sound';
import { buzz } from './haptics';

export const PRODUCT = 'full_reading';
const KEY = 'bhava.full', PRICE_KEY = 'bhava.fullPrice';
const native = () => Capacitor.isNativePlatform();

const CODE_KEY = 'bhava.fullCode';
export const ownsFull = (): boolean => { try { return localStorage.getItem(KEY) === '1' || localStorage.getItem(CODE_KEY) === '1'; } catch { return false; } };

/* A code for Google Play's app reviewers, who are not allowed to buy anything: it opens the Full reading
   on their device only. Only its hash is in the app, so the code itself can't be read out of it. */
const REVIEW_HASH = 'c59ce4e22881ff2d30d48eeac30a7b0fd495a44d4d20cc567e69ec98aa7baf34';
export async function redeemCode(code: string): Promise<boolean> {
  const clean = code.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean || !globalThis.crypto?.subtle) return false;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`bhava:${clean}`));
  const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  if (hex !== REVIEW_HASH) return false;
  try { localStorage.setItem(CODE_KEY, '1'); } catch { /* session only */ }
  return true;
}
function setOwned(on: boolean) { try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* session only */ } }
const cachedPrice = () => { try { return localStorage.getItem(PRICE_KEY) || ''; } catch { return ''; } };

/* The label for every "open it" button. */
export function unlockLabel(): string {
  if (!native()) return 'Open it (free in the browser preview)';
  const p = cachedPrice();
  return p ? `Open the Full reading · ${p}` : 'Open the Full reading';
}

const owned = (list: { productIdentifier: string; purchaseState?: string }[]) =>
  list.some(t => t.productIdentifier === PRODUCT && (t.purchaseState === undefined || t.purchaseState === '1'));

/* On start: learn the local price, and check what Google Play says this account owns. */
export async function initPurchases(): Promise<void> {
  if (!native()) return;
  await loadProduct(); // offline, or the product isn't live yet: no price shown
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    setOwned(owned(purchases)); // only changed when Google Play answered
  } catch { /* offline: keep what we knew */ }
}

/* Ask Google Play for the product and its local price. False when Play doesn't offer it (yet). */
async function loadProduct(): Promise<boolean> {
  try {
    const { product } = await NativePurchases.getProduct({ productIdentifier: PRODUCT, productType: PURCHASE_TYPE.INAPP });
    if (product?.priceString) localStorage.setItem(PRICE_KEY, product.priceString);
    return !!product;
  } catch { return false; }
}

type BuyResult = { result: 'owned' | 'cancelled' | 'failed' | 'pending'; detail?: string };
async function buy(): Promise<BuyResult> {
  if (!native()) { setOwned(true); return { result: 'owned' }; }
  try {
    const t = await NativePurchases.purchaseProduct({ productIdentifier: PRODUCT, productType: PURCHASE_TYPE.INAPP });
    if (t && (t.purchaseState === undefined || t.purchaseState === '1')) { setOwned(true); return { result: 'owned' }; }
    return { result: 'pending' }; // some cash methods finish later; picked up on the next start
  } catch (e) {
    const raw = String((e as Error)?.message ?? e), msg = raw.toLowerCase();
    if (msg.includes('cancel')) return { result: 'cancelled' };
    if (msg.includes('already') || msg.includes('owned')) { await restore(); return ownsFull() ? { result: 'owned' } : { result: 'failed', detail: raw }; }
    return { result: 'failed', detail: raw };
  }
}

export async function restore(): Promise<boolean> {
  if (!native()) return ownsFull();
  try {
    await NativePurchases.restorePurchases().catch(() => {});
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    setOwned(owned(purchases));
  } catch { /* offline */ }
  return ownsFull();
}

/* The sheet that explains what the Full reading holds, with Buy and Restore. Calls done() once owned. */
export function openFullSheet(done: () => void): void {
  if (ownsFull()) return done();
  const el = document.createElement('div');
  el.className = 'sheet';
  el.innerHTML = `<div class="sheet-card full-sheet" role="dialog" aria-modal="true" aria-label="The Full reading">
    <div class="sheet-head"><h2>The Full reading</h2><button class="link" data-close>Not now</button></div>
    <p>Everything your chart has to say, read for you and your dates. One payment, yours for good, no subscription.</p>
    <ul class="full-list">
      <li><b>Houses 5 to 12</b> read in full, each with its planets, stars and timing</li>
      <li><b>The whole chart</b> read together, once your twelve houses are cleared</li>
      <li><b>Your dasha timeline</b>: every period of your life, month by month</li>
      <li><b>Compatibility</b> with up to 4 people: porondam and the 36-point match, every point explained</li>
      <li><b>Every ad reward without watching ads</b>: second breath, double karma, shrine blessings</li>
    </ul>
    <p id="fullMsg" class="hint" role="status"></p>
    <button class="primary" id="fullBuy">${native() ? (cachedPrice() ? `Buy · ${cachedPrice()}` : 'Buy') : 'Open it (free in the browser preview)'}</button>
    ${native() ? '<button class="link" id="fullRestore">I bought it before: restore</button>' : ''}
    <p class="disclaimer">Paid through Google Play. Readings are for entertainment and self-reflection.</p>
  </div>`;
  document.body.appendChild(el);
  const msg = el.querySelector<HTMLElement>('#fullMsg')!, buyBtn = el.querySelector<HTMLButtonElement>('#fullBuy')!;
  const close = () => el.remove();
  const success = () => { close(); sfx('yoga'); buzz('win'); done(); };
  el.querySelector('[data-close]')!.addEventListener('click', close);
  el.addEventListener('click', e => { if (e.target === el) close(); });
  // refresh the price while the sheet is open; if Play doesn't offer the product, say so plainly
  let offered = true;
  if (native()) void loadProduct().then(ok => {
    offered = ok;
    if (ok && cachedPrice()) buyBtn.textContent = `Buy · ${cachedPrice()}`;
    if (!ok) msg.textContent = 'Google Play is not offering the Full reading on this phone yet. If the app was just published, try again in a little while.';
  });
  buyBtn.addEventListener('click', async () => {
    buyBtn.disabled = true; msg.textContent = 'Opening Google Play…';
    if (native() && !offered) offered = await loadProduct();
    const r = await buy();
    buyBtn.disabled = false;
    if (r.result === 'owned') return success();
    msg.textContent = r.result === 'cancelled' ? ''
      : r.result === 'pending' ? 'Google Play is still confirming the payment. It will open here as soon as it clears.'
      : `The purchase did not go through. Nothing was charged. Try again, or restore if you bought it before.${r.detail ? ` (Google Play said: ${r.detail.slice(0, 140)})` : ''}`;
  });
  el.querySelector('#fullRestore')?.addEventListener('click', async () => {
    msg.textContent = 'Checking Google Play…';
    if (await restore()) return success();
    msg.textContent = 'No earlier purchase was found on this Google account.';
  });
}
