/* Builds readings from a chart: the first reading and each house's reading.
   Every reading is shown with the label "For entertainment and self-reflection". */
import type { Reading } from '../seed';
import { ordinal } from '../seed';
import { LAGNA_READ, MOON_READ, NO_TIME_NOTE } from './first';
import { HOUSE_MEANING, HOUSE_NAME, lordLine, placementNote, RETRO_LINE, STRENGTH_LINE } from './houses';
import { PLANET_IN_HOUSE } from './planets';
import { SIGNS } from './signs';

/* 'the Sun' and 'the Moon', but plain 'Mars', 'Saturn' */
export const the = (p: string, cap = false) => (p === 'Sun' || p === 'Moon' ? `${cap ? 'The' : 'the'} ${p}` : p);

export type Section = { heading: string; text: string; planet?: string };
export type ReadingText = { title: string; subtitle: string; sections: Section[] };

export const FREE_HOUSES = 4;      // house readings 1-4 are free; 5-12 come with the Full reading
export const DISCLAIMER = 'For entertainment and self-reflection.';

export function firstReading(r: Reading): ReadingText {
  const moon = r.chart.by.Moon.sign, lagna = r.lagnaSign;
  const sections: Section[] = [];
  if (r.timeKnown) sections.push({ heading: `Your lagna: ${SIGNS[lagna]}`, text: LAGNA_READ[lagna] });
  else sections.push({ heading: 'No birth time', text: NO_TIME_NOTE });
  sections.push({ heading: `Your Moon: ${SIGNS[moon]}`, text: MOON_READ[moon], planet: 'Moon' });
  return { title: 'Your first reading', subtitle: r.timeKnown ? `${SIGNS[lagna]} rising, Moon in ${SIGNS[moon]}` : `Moon in ${SIGNS[moon]}`, sections };
}

export function houseReading(r: Reading, n: number): ReadingText {
  const h = r.houses[n - 1], m = HOUSE_MEANING[n - 1];
  const sections: Section[] = [{ heading: `${ordinal(n)} house · ${HOUSE_NAME[n - 1]} bhava`, text: `${m.text} In your chart it falls in ${h.signName}, ruled by ${the(h.lord)}.` }];
  for (const p of h.planets) {
    const extra = [STRENGTH_LINE[p.dignity] ?? '', p.retro ? RETRO_LINE : ''].filter(Boolean).join(' ');
    sections.push({ heading: `${the(p.name, true)} in your ${ordinal(n)}`, text: `${PLANET_IN_HOUSE[p.name][n - 1]}${extra ? ` ${extra}` : ''}`, planet: p.name });
  }
  if (!h.planets.length) sections.push({ heading: 'An empty house', text: `No planet lives in your ${ordinal(n)} house. That is common and says nothing bad: an empty house is read through its lord, the planet that rules its sign.` });
  sections.push({
    heading: `Its lord, ${the(h.lord)}, in your ${ordinal(h.lordHouse)}`,
    text: `${lordLine(n, h.lordHouse)} ${n === h.lordHouse ? '' : placementNote(h.lordHouse)}`.trim(),
    planet: h.lord,
  });
  return { title: `The ${ordinal(n)} house`, subtitle: m.short.charAt(0).toUpperCase() + m.short.slice(1), sections };
}
