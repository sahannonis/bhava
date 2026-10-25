/* The run in progress, kept on the phone so it can be picked up later. */
import type { RunState } from './game/run';
const KEY = 'bhava.run';

export function loadRun(): RunState | null {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.v === 1 && !v.over ? v : null; } catch { return null; }
}
export function saveRun(run: RunState): void {
  try { localStorage.setItem(KEY, JSON.stringify(run)); } catch { /* kept for this session only */ }
}
export function endRun(): void {
  try { localStorage.removeItem(KEY); } catch { /* nothing kept */ }
}
export function nextRunNumber(): number {
  try { const n = Number(localStorage.getItem('bhava.runs') || '0') + 1; localStorage.setItem('bhava.runs', String(n)); return n; } catch { return Date.now() % 100000; }
}

/* Houses cleared in any run. They stay cleared, and their readings stay open. */
export function loadCleared(): number[] {
  try { return JSON.parse(localStorage.getItem('bhava.cleared') || '[]'); } catch { return []; }
}
export function markCleared(n: number): void {
  try { const s = new Set(loadCleared()); s.add(n); localStorage.setItem('bhava.cleared', JSON.stringify([...s].sort((a, b) => a - b))); } catch { /* session only */ }
}
