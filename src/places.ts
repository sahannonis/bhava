/* About 172,000 birthplaces, bundled with the app (same list as Samsara, see its tools/build-places.js).
   Nothing is looked up online: birth data never leaves the phone. */
import tzlookup from 'tz-lookup';
import placesUrl from './data/places.bin?url';

export type Place = { name: string; prov: string; country: string; lat: number; lon: number; tz: string };
type Indexed = Place & { n: string; key: string };

export const fold = (s: string) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

let PLACES: Indexed[] = [];
let ready: Promise<void> | null = null;

async function readText(): Promise<string> {
  const res = await fetch(placesUrl);
  const buf = new Uint8Array(await res.arrayBuffer());
  // gzip unless the server already unpacked it
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }
  return new TextDecoder().decode(buf);
}

export function loadPlaces(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    const L = (await readText()).split('\n');
    const TZ = L[0].split('|').slice(1), AD = L[1].split('|').slice(1), out: Indexed[] = [];
    let dn: Intl.DisplayNames | null = null;
    try { dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { dn = null; }
    const add = (p: Place) => out.push({ ...p, n: fold(p.name), key: fold(`${p.name} ${p.prov} ${p.country}`) });
    let i = 2;
    for (; i < L.length && L[i] !== '='; i++) {
      const r = L[i].split('|');
      add({ name: r[0], prov: r[1], country: r[2], lat: +r[3], lon: +r[4], tz: TZ[parseInt(r[5], 36)] });
    }
    let cn = '';
    for (i++; i < L.length; i++) {
      const l = L[i];
      if (!l) continue;
      if (l[0] === '#') { const cc = l.slice(1); try { cn = (dn && dn.of(cc)) || cc; } catch { cn = cc; } continue; }
      const r = l.split('|');
      add({ name: r[0], prov: AD[parseInt(r[1], 36)], country: cn, lat: +r[2], lon: +r[3], tz: TZ[parseInt(r[4], 36)] });
    }
    PLACES = out;
  })();
  ready.catch(() => { ready = null; });
  return ready;
}

/* Up to 8 matches: names that start with the words first, then any place whose name,
   region or country holds them. */
export function findPlaces(q: string): Place[] {
  q = fold(q.trim());
  if (q.length < 2) return [];
  const starts: Indexed[] = [], has: Indexed[] = [];
  for (const c of PLACES) {
    if (c.n.startsWith(q)) starts.push(c);
    else if (has.length < 8 && c.key.includes(q)) has.push(c);
    if (starts.length >= 60) break;
  }
  // exact names first, then places in the phone's own time zone (so local towns lead)
  const rank = (c: Indexed) => (c.n === q ? 0 : 2) + (c.tz === HOME_TZ ? 0 : 1);
  starts.sort((a, b) => rank(a) - rank(b));
  return starts.concat(has).slice(0, 8);
}

const HOME_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();

/* "6.98, 79.92" or "6.98 N 79.92 E", pasted from any map, for a village the list doesn't have. */
export function placeFromCoords(text: string): Place | null {
  const m = String(text).toUpperCase().match(/(-?\d+(?:\.\d+)?)\s*°?\s*([NS])?[\s,;]+(-?\d+(?:\.\d+)?)\s*°?\s*([EW])?/);
  if (!m) return null;
  let lat = +m[1], lon = +m[3];
  if (m[2] === 'S') lat = -Math.abs(lat);
  if (m[4] === 'W') lon = -Math.abs(lon);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  let tz: string;
  try { tz = tzlookup(lat, lon); } catch { return null; }
  return { name: `${lat.toFixed(3)}, ${lon.toFixed(3)}`, prov: '', country: '', lat, lon, tz };
}

export const placeLabel = (p: Place) =>
  [p.name, p.prov, p.country].filter((x, i, a) => x && a.indexOf(x) === i).join(', ');
