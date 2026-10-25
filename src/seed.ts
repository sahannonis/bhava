/* The seed: a real birth becomes a class and twelve houses.
   See the spec, "The seed: your birth builds your twelve houses". */
import { E, type Chart } from './engine';
import type { Place } from './places';

export type Birth = { date: string; time: string | null; place: Place };

export type ClassInfo = { ruler: string; name: string; style: string };
export const CLASSES: Record<string, ClassInfo> = {
  Sun: { ruler: 'Sun', name: 'The Radiant', style: '8 more health, and 1 more might every third turn.' },
  Moon: { ruler: 'Moon', name: 'The Tide', style: 'Heal 2 at the end of each of your turns.' },
  Mars: { ruler: 'Mars', name: 'The Blade', style: 'Start every fight with 1 might.' },
  Mercury: { ruler: 'Mercury', name: 'The Weaver', style: 'Draw 6 cards a turn instead of 5.' },
  Jupiter: { ruler: 'Jupiter', name: 'The Sage', style: 'Start every fight with 8 block.' },
  Venus: { ruler: 'Venus', name: 'The Charmer', style: 'Every enemy starts the fight weak.' },
  Saturn: { ruler: 'Saturn', name: 'The Ascetic', style: 'From the fourth turn on, 4 breath a turn instead of 3.' },
};

export type Strength = 'strong' | 'normal' | 'weak';
export type HousePlanet = { name: string; dignity: string; strength: Strength; retro: boolean };
export type HouseKind = 'fight' | 'boss' | 'rest' | 'gate';
export type House = {
  n: number; sign: number; signName: string; element: string;
  lord: string; lordHouse: number; planets: HousePlanet[]; kind: HouseKind;
};

export type Reading = {
  birth: Birth; chart: Chart; utc: number; offset: string; timeKnown: boolean;
  lagnaSign: number; cls: ClassInfo; houses: House[]; seed: number;
};

const strengthOf = (dignity: string): Strength =>
  dignity === 'exalted' || dignity === 'own sign' ? 'strong' : dignity === 'debilitated' ? 'weak' : 'normal';

/* A 53-bit hash of the exact birth: the random seed for card offers and enemy order. */
function hash(str: string): number {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function castChart(birth: Birth): Reading {
  const [y, mo, d] = birth.date.split('-').map(Number);
  const timeKnown = !!birth.time;
  const [h, mi] = timeKnown ? birth.time!.split(':').map(Number) : [12, 0];
  const { utc, offset } = E.localToUTC(y, mo, d, h, mi, birth.place.tz);
  const chart = E.chart(utc, birth.place.lat, birth.place.lon);

  // Without the hour the lagna can't be known; read the houses from the Moon instead (Chandra lagna).
  if (!timeKnown) {
    const ms = chart.by.Moon.sign;
    chart.lagna = Object.assign(E.describe(ms * 30), { chandra: true });
    chart.planets.forEach(p => { p.house = ((p.sign - ms + 12) % 12) + 1; });
  }
  const lagnaSign = chart.lagna.sign;
  const signs = E.SIGNS;
  const houseOf = (sign: number) => ((sign - lagnaSign + 12) % 12) + 1;

  const houses: House[] = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1, sign = (lagnaSign + i) % 12, s = signs[sign];
    const planets = chart.planets
      .filter(p => p.house === n)
      .map(p => ({ name: p.name, dignity: p.dignity, strength: strengthOf(p.dignity), retro: p.retro && p.name !== 'Rahu' && p.name !== 'Ketu' }));
    const kind: HouseKind = n === 12 ? 'gate' : planets.length >= 2 ? 'boss' : planets.length === 1 ? 'fight' : 'rest';
    return { n, sign, signName: s.en, element: s.el, lord: s.lord, lordHouse: houseOf(chart.by[s.lord].sign), planets, kind };
  });

  return {
    birth, chart, utc, offset: E.fmtOffset(offset), timeKnown, lagnaSign,
    cls: CLASSES[signs[lagnaSign].lord], houses,
    seed: hash(`${utc}|${birth.place.lat.toFixed(4)}|${birth.place.lon.toFixed(4)}`),
  };
}

export const ordinal = (n: number) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
