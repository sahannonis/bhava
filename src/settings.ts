/* Small player settings, kept on the phone. */
export type Look = 'f' | 'm';
/* look: which of the two portraits of your class you chose (none until you choose) */
export type Settings = { vibration: boolean; sound: boolean; reminder: boolean; guideDone: boolean; mapGuideDone?: boolean; look?: Look };
const KEY = 'bhava.settings';
const DEFAULTS: Settings = { vibration: true, sound: true, reminder: false, guideDone: false };

export function getSettings(): Settings {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}

export function setSetting<K extends keyof Settings>(k: K, v: Settings[K]): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), [k]: v })); } catch { /* kept for this session only */ }
}
