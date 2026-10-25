/* Small player settings, kept on the phone. */
export type Settings = { vibration: boolean; guideDone: boolean };
const KEY = 'bhava.settings';
const DEFAULTS: Settings = { vibration: true, guideDone: false };

export function getSettings(): Settings {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}

export function setSetting<K extends keyof Settings>(k: K, v: Settings[K]): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), [k]: v })); } catch { /* kept for this session only */ }
}
