/* Everything is kept on this phone only (Capacitor Preferences; localStorage on the web). */
import { Preferences } from '@capacitor/preferences';
import type { Birth } from './seed';

const KEY = 'bhava.birth';

export async function loadBirth(): Promise<Birth | null> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value ? (JSON.parse(value) as Birth) : null;
  } catch {
    return null;
  }
}

export async function saveBirth(b: Birth): Promise<void> {
  try { await Preferences.set({ key: KEY, value: JSON.stringify(b) }); } catch { /* still playable without saving */ }
}

export async function forgetBirth(): Promise<void> {
  try { await Preferences.remove({ key: KEY }); } catch { /* nothing kept */ }
}
