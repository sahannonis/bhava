/* Karma, upgrades, lives and the daily streak, kept on the phone. */
import { newMeta, type Meta } from './game/meta';
const KEY = 'bhava.meta';

export function loadMeta(): Meta {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!v || v.v !== 1) return newMeta();
    const m = { ...newMeta(), ...v };
    m.daily = { ...newMeta().daily, ...v.daily };
    return m;
  } catch { return newMeta(); }
}
export function saveMeta(m: Meta): void {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* kept for this session only */ }
}
export function withMeta<T>(f: (m: Meta) => T): T {
  const m = loadMeta(); const out = f(m); saveMeta(m); return out;
}
