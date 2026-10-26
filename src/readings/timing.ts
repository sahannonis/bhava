/* Time in a chart: the Vimshottari dashas (the planet periods that run through a whole life, started by
   the Moon's nakshatra at birth), the ages at which each planet matures, and today's sky over a house.
   This is what makes a reading about a person's own years, not a sign in general. */
import { E, type Period } from '../engine';
import type { Reading } from '../seed';
import { ordinal } from '../seed';

const YEAR = 365.25 * 86400000;
export const yearOf = (ms: number) => new Date(ms).getFullYear();
export const ageAt = (r: Reading, ms: number) => Math.floor((ms - r.utc) / YEAR);
const monthYear = (ms: number) => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(ms));

export function lifeDashas(r: Reading) {
  return E.dashas(r.utc, r.chart.by.Moon.lon);
}
/* The periods inside a life: from birth to about age 100. */
export function mahadashas(r: Reading): Period[] {
  const end = r.utc + 100 * YEAR;
  return lifeDashas(r).list.filter(p => p.end > r.utc && p.start < end).map(p => ({ ...p, start: Math.max(p.start, r.utc) }));
}
export function nowPeriods(r: Reading, now = Date.now()) {
  return E.dashaAt(lifeDashas(r), now);
}

/* Where a period sits for this person: behind them, now, or ahead, in years and ages. */
export function when(r: Reading, p: { start: number; end: number }, now = Date.now()): string {
  const a = yearOf(p.start), b = yearOf(p.end), ageA = ageAt(r, p.start), ageB = ageAt(r, p.end);
  if (p.end <= now) return `ran from ${a} to ${b}, from age ${ageA} to ${ageB}`;
  if (p.start <= now) return `runs from ${a} to ${b}, and you are in it now, until ${monthYear(p.end)}`;
  return `begins in ${monthYear(p.start)}, when you are ${ageA}, and runs to ${b}`;
}

/* Classic ages at which each planet "matures" and gives its results most fully. */
export const MATURITY: Record<string, number> = { Jupiter: 16, Sun: 22, Moon: 24, Venus: 25, Mars: 28, Mercury: 32, Saturn: 36, Rahu: 42, Ketu: 48 };
export function maturityLine(r: Reading, planet: string, now = Date.now()): string {
  const age = MATURITY[planet], ms = r.utc + age * YEAR, y = yearOf(ms);
  const name = planet === 'Sun' || planet === 'Moon' ? `the ${planet}` : planet;
  return ms <= now ? `${name.charAt(0).toUpperCase() + name.slice(1)} matured at ${age}, in ${y}: what it promises here has been ripening since then.`
    : `${name.charAt(0).toUpperCase() + name.slice(1)} matures at ${age}, in ${y}: what it promises here comes into its own from then.`;
}

/* What each planet's mahadasha tends to bring. */
export const DASHA_TEXT: Record<string, { years: number; text: string; tone: string }> = {
  Ketu: { years: 7, tone: 'release and inner turning', text: 'A Ketu period loosens your grip. Things you held tightly may fall away, and what remains is what was truly yours. It is a time for depth, spiritual questions and sudden insight, more than for building.' },
  Venus: { years: 20, tone: 'love, comfort and creation', text: 'A Venus period is the longest of all, twenty years of relationships, beauty, comfort and creative work. Love, marriage, art, money for pleasure and the good things of life come forward.' },
  Sun: { years: 6, tone: 'authority and self-assertion', text: 'A Sun period asks you to stand up and be counted. Career, recognition, authority and the father come forward, and you learn who you are when you have to lead.' },
  Moon: { years: 10, tone: 'feeling, home and the public', text: 'A Moon period turns life toward the heart: home, mother, moods, family and the public. Things rise and fall like tides, and your inner peace becomes the thing that matters most.' },
  Mars: { years: 7, tone: 'drive, courage and conflict', text: 'A Mars period is a time of action. Energy, ambition, property, sport and competition come forward, and so do arguments. What you fight for in these years, you usually win.' },
  Rahu: { years: 18, tone: 'hunger, change and the new', text: 'A Rahu period is eighteen years of wanting more. It brings sudden rises, foreign places, new technology and unconventional paths, and it can confuse as much as it rewards. Stay honest with yourself and it carries you far.' },
  Jupiter: { years: 16, tone: 'growth, wisdom and blessing', text: 'A Jupiter period is a time of growth. Learning, teachers, children, faith, wealth and good advice come forward, and doors tend to open. It rewards generosity and patience.' },
  Saturn: { years: 19, tone: 'work, patience and lasting results', text: 'A Saturn period is nineteen years of slow, real building. It asks for discipline and can feel heavy, with delays and responsibility, but what you build in Saturn\'s years lasts the rest of your life.' },
  Mercury: { years: 17, tone: 'learning, trade and connection', text: 'A Mercury period quickens the mind. Study, writing, business, travel, friends and clever deals come forward. It is a good time to learn a skill and turn it into a living.' },
};
export const ANTAR_TONE: Record<string, string> = {
  Ketu: 'a letting-go', Venus: 'love and ease', Sun: 'a call to step forward', Moon: 'feeling and family', Mars: 'action and heat',
  Rahu: 'restlessness and new hungers', Jupiter: 'help and growth', Saturn: 'effort and testing', Mercury: 'ideas, talk and deals',
};

/* The houses a planet rules in this chart (by the signs on them). */
export function housesRuledBy(r: Reading, planet: string): number[] {
  return r.houses.filter(h => h.lord === planet).map(h => h.n);
}
export function planetHouse(r: Reading, planet: string): number {
  return ((r.chart.by[planet].sign - r.lagnaSign + 12) % 12) + 1;
}

/* "Your Saturn period ... In your chart Saturn sits in your 9th and rules your 10th and 11th." */
export function periodInYourChart(r: Reading, planet: string): string {
  const at = planetHouse(r, planet), rules = housesRuledBy(r, planet);
  const name = planet === 'Sun' || planet === 'Moon' ? `the ${planet}` : planet;
  const ruled = rules.length ? ` and rules your ${rules.map(ordinal).join(' and ')}` : '';
  return `In your chart ${name} sits in your ${ordinal(at)}${ruled}, so these years bring ${[at, ...rules].map(n => SHORT[n - 1]).filter((v, i, a) => a.indexOf(v) === i).join(', ')} to the front.`;
}
const SHORT = ['your self and health', 'money and family', 'courage and siblings', 'home and mother', 'children and creativity', 'work and health', 'partnership',
  'change and hidden matters', 'luck, faith and teachers', 'career and standing', 'gains and friends', 'letting go and faraway places'];

/* The nearest sub-period (antardasha) of a planet, now or ahead, inside whichever great period holds it. */
export function nextSub(r: Reading, planet: string, now = Date.now()) {
  for (const md of lifeDashas(r).list) for (const ad of md.sub) {
    if (ad.lord !== planet || ad.end <= now) continue;
    return { within: md.lord, start: ad.start, end: ad.end, now: ad.start <= now };
  }
  return null;
}
