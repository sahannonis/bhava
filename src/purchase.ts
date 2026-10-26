/* The Full reading. Day 10 connects this to Google Play's one-time purchase;
   until then the test build can open it for free so testers can read everything. */
const KEY = 'bhava.full';
export const ownsFull = (): boolean => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const TEST_BUILD = true;
export function openFullForTest(): void { try { localStorage.setItem(KEY, '1'); } catch { /* session only */ } }
