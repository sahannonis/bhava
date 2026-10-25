/* Phone vibration. One-shot vibrations at the phone's own default strength are felt on far more
   Android phones than the short shaped "impact" patterns, which some phones play too softly to notice.
   Falls back to the browser's vibrate where the native plugin isn't there. */
import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import { getSettings } from './settings';

export type Buzz = 'tap' | 'hit' | 'big' | 'win' | 'lose' | 'yoga';
const MS: Record<Buzz, number[]> = {
  tap: [18],
  hit: [40],
  big: [75],
  yoga: [30, 60, 30],
  win: [40, 80, 40, 80, 90],
  lose: [120, 90, 160],
};

export function buzz(kind: Buzz, force = false): void {
  if (!force && !getSettings().vibration) return;
  const pattern = MS[kind];
  try {
    if (Capacitor.isNativePlatform()) {
      // play the pattern as one-shots: on, pause, on ...
      let at = 0;
      pattern.forEach((ms, i) => {
        if (i % 2 === 0) setTimeout(() => { void Haptics.vibrate({ duration: ms }).catch(() => {}); }, at);
        at += ms;
      });
    } else if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch { /* no vibration on this device */ }
}
