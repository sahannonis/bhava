/* The Samsara star engine, frozen for Bhava.
   star-engine.js is copied from sahannonis/samsara (commit b2791ab, 21 Oct 2026), unchanged except
   that its wrapper also falls back to globalThis (so it loads in Node tests too),
   so changes in Samsara can't break Bhava mid-build. Planet positions come from
   Astronomy Engine 2.1.19 (MIT), the same version Samsara ships. */
import * as Astronomy from 'astronomy-engine';
import * as starEngine from './star-engine.js';

export type Planet = {
  name: string; sa: string; lon: number; sign: number; deg: number; house: number;
  nak: number; nakName: string; pada: number; retro: boolean; dignity: string;
};
export type Chart = {
  utc: number; lat: number; lon: number;
  lagna: { lon: number; sign: number; deg: number; chandra?: boolean };
  planets: Planet[]; by: Record<string, Planet>;
};
export type Sign = { en: string; sa: string; el: 'fire' | 'earth' | 'air' | 'water'; lord: string };

type Engine = {
  SIGNS: Sign[];
  GRAHAS: string[];
  chart(utcMs: number, lat: number, lon: number): Chart;
  describe(lon: number): { lon: number; sign: number; deg: number };
  localToUTC(y: number, mo: number, d: number, h: number, mi: number, tz: string): { utc: number; offset: number };
  fmtOffset(min: number): string;
};

// The engine file is UMD: bundled it arrives as a CommonJS default; served raw it sets a global.
const make = ((starEngine as any).default ?? (globalThis as any).createStarEngine) as (a: unknown) => Engine;
export const E: Engine = make(Astronomy);
