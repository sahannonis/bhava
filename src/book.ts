/* The Book of the Sky: which pages are open. A page opens the first time you meet its subject in play. */
import { knownYogas, learnYoga } from './game/yogas';
import { withMeta } from './metaStore';

type Part = 'planets' | 'houses' | 'signs';
type Book = Record<Part, (string | number)[]>;
const KEY = 'bhava.book';

export function loadBook(): Book & { yogas: string[] } {
  let b: Partial<Book> = {};
  try { b = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* empty book */ }
  return { planets: b.planets ?? [], houses: b.houses ?? [], signs: b.signs ?? [], yogas: knownYogas() };
}

/* Opens pages; returns the ones that were new, for a small note on screen. */
export const PART_REWARD = 10; // karma for finishing a part of the book

export function learn(part: Part | 'yogas', ids: (string | number)[]): (string | number)[] {
  if (part === 'yogas') {
    const fresh = ids.filter(id => learnYoga(String(id)));
    if (fresh.length && knownYogas().length === BOOK_SIZE.yogas) reward();
    return fresh;
  }
  const b = loadBook(), have = new Set(b[part]);
  const fresh = [...new Set(ids)].filter(id => !have.has(id));
  if (!fresh.length) return [];
  b[part] = [...b[part], ...fresh];
  try { localStorage.setItem(KEY, JSON.stringify({ planets: b.planets, houses: b.houses, signs: b.signs })); } catch { /* session only */ }
  if (b[part].length === BOOK_SIZE[part]) reward();
  return fresh;
}
const reward = () => withMeta(m => { m.karma += PART_REWARD; m.earned += PART_REWARD; });

export const BOOK_SIZE = { planets: 9, houses: 12, signs: 12, yogas: 9 };
export const bookCount = () => { const b = loadBook(); return b.planets.length + b.houses.length + b.signs.length + b.yogas.length; };
