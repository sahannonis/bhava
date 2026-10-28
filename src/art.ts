/* The painted art. Whatever images are in src/art/ when the game is built are used; anything missing
   falls back to the ink drawn in code, so the game always looks whole while the paintings arrive.
   Names follow the spec's image list: class-jupiter, enemy-rahu, spirit-ember-imp, ground-water ... */
import type { EnemyDef } from './game/enemies';

const files = import.meta.glob('./art/*.{webp,png,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const ART: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) ART[path.split('/').pop()!.replace(/\.\w+$/, '')] = url;

export const art = (name: string): string | undefined => ART[name];

const kebab = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

/* Which painting a foe uses. A joined boss wears its first planet's face. */
export function enemyArt(def: Pick<EnemyDef, 'id' | 'rank' | 'planet'>): string | undefined {
  if (def.rank === 'practice') return art('shade-practice');
  if (def.rank === 'gate') return art('shade-gate');
  if (def.planet) return art(`enemy-${def.planet.toLowerCase()}`);
  return art(`spirit-${kebab(def.id)}`);
}
export const classArt = (ruler: string) => art(`class-${ruler.toLowerCase()}`);
export const groundArt = (element: string) => art(`ground-${element}`);
export const placeArt = (place: 'hub' | 'shrine' | 'gate') => art(`place-${place}`);
