/* Builds readings from one person's chart and time: the first reading, each house's reading,
   the whole-chart reading and the dasha timeline. Every reading carries the label
   "For entertainment and self-reflection". */
import type { Reading } from '../seed';
import { ordinal } from '../seed';
import { todaySky } from '../today';
import { LAGNA_READ, MOON_READ, NO_TIME_NOTE } from './first';
import { HOUSE_MEANING, HOUSE_NAME, lordLine, placementNote, RETRO_LINE, STRENGTH_LINE } from './houses';
import { PLANET_IN_HOUSE } from './planets';
import { SIGNS, YOGA_PAGE, chartYogas } from './signs';
import { NAKSHATRAS, nakOf, padaOf } from './nakshatras';
import { SIGN_FLAVOUR, aspectsOn, GAZE, STAY, houseScore, toneOf, THREAD, ELEMENT_LINE, HARD_HOUSE_STRONG } from './depth';
import { mahadashas, nowPeriods, when, maturityLine, DASHA_TEXT, ANTAR_TONE, periodInYourChart, yearOf, ageAt, nextSub } from './timing';

/* 'the Sun' and 'the Moon', but plain 'Mars', 'Saturn' */
export const the = (p: string, cap = false) => (p === 'Sun' || p === 'Moon' ? `${cap ? 'The' : 'the'} ${p}` : p);

export type Section = { heading: string; text: string; planet?: string; kind?: 'time' | 'thread' | 'now' };
export type ReadingText = { title: string; subtitle: string; sections: Section[] };

export const FREE_HOUSES = 4;      // house readings 1-4 are free; 5-12 come with the Full reading
export const DISCLAIMER = 'For entertainment and self-reflection.';
const monthYear = (ms: number) => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(ms));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- the first reading (free) ---------- */
export function firstReading(r: Reading, now = Date.now()): ReadingText {
  const moon = r.chart.by.Moon, lagna = r.lagnaSign, nk = nakOf(moon.lon), N = NAKSHATRAS[nk];
  const sections: Section[] = [];
  if (r.timeKnown) {
    const ln = NAKSHATRAS[nakOf(r.chart.lagna.lon)];
    sections.push({ heading: `Your lagna: ${SIGNS[lagna]}`, text: `${LAGNA_READ[lagna]} Your rising degree falls in ${ln.name}, ${ln.key}.` });
  } else sections.push({ heading: 'No birth time', text: NO_TIME_NOTE });
  sections.push({ heading: `Your Moon: ${SIGNS[moon.sign]}`, text: MOON_READ[moon.sign], planet: 'Moon' });
  sections.push({ heading: `Your birth star: ${N.name}`, text: `${N.text} Its symbol is ${N.symbol}; its deity is ${N.deity}. Your Moon stands in its ${ordinal(padaOf(moon.lon))} quarter.`, planet: 'Moon' });
  const h1 = r.houses[0];
  if (r.timeKnown) sections.push({ heading: `Your chart's ruler: ${the(h1.lord)}`, text: `${the(h1.lord, true)} rules your lagna, so wherever it sits is where your life keeps returning. It sits in your ${ordinal(h1.lordHouse)} house: ${lordLine(1, h1.lordHouse).replace(/^Your sense of self, your health and your direction in life /, 'your sense of self and direction ')}` });
  const p = nowPeriods(r, now);
  if (p) {
    const d = DASHA_TEXT[p.md.lord];
    sections.push({
      heading: `The chapter you are in: ${the(p.md.lord)}`, kind: 'now', planet: p.md.lord,
      text: `Since ${monthYear(p.md.start)} you have been living through your ${p.md.lord} period, ${d.years} years of ${d.tone}, until ${monthYear(p.md.end)}. Inside it, a shorter ${p.ad.lord} chapter of ${ANTAR_TONE[p.ad.lord]} runs until ${monthYear(p.ad.end)}. ${periodInYourChart(r, p.md.lord)}`,
    });
  }
  return { title: 'Your first reading', subtitle: r.timeKnown ? `${SIGNS[lagna]} rising, Moon in ${SIGNS[moon.sign]}, born under ${N.name}` : `Moon in ${SIGNS[moon.sign]}, born under ${N.name}`, sections };
}

/* ---------- a house ---------- */
export function houseReading(r: Reading, n: number, now = Date.now()): ReadingText {
  const h = r.houses[n - 1], m = HOUSE_MEANING[n - 1];
  const sections: Section[] = [{ heading: `${ordinal(n)} house · ${HOUSE_NAME[n - 1]} bhava`, text: `${m.text} In your chart it falls in ${h.signName}, ruled by ${the(h.lord)}: here, this part of your life ${SIGN_FLAVOUR[h.sign].replace(/^it /, '')}.` }];

  for (const p of h.planets) {
    const pos = r.chart.by[p.name], N = NAKSHATRAS[nakOf(pos.lon)];
    const extra = [STRENGTH_LINE[p.dignity] ?? '', p.retro ? RETRO_LINE : ''].filter(Boolean).join(' ');
    sections.push({
      heading: `${the(p.name, true)} in your ${ordinal(n)}`, planet: p.name,
      text: `${PLANET_IN_HOUSE[p.name][n - 1]} It stands in ${N.name}, ${N.key}.${extra ? ` ${extra}` : ''}`,
    });
  }
  if (!h.planets.length) sections.push({ heading: 'An empty house', text: `No planet lives in your ${ordinal(n)} house. That is common and says nothing bad: an empty house is read through its lord and through the planets that look at it.` });

  const eyes = aspectsOn(r, n);
  if (eyes.length) sections.push({
    heading: 'Who watches over it',
    text: eyes.map(e => `${the(e.planet, true)} looks at it from your ${ordinal(e.from)}, and ${GAZE[e.planet]}.`).join(' '),
  });

  sections.push({
    heading: `Its lord, ${the(h.lord)}, in your ${ordinal(h.lordHouse)}`, planet: h.lord,
    text: `${lordLine(n, h.lordHouse)} ${n === h.lordHouse ? '' : placementNote(h.lordHouse)}`.trim(),
  });

  sections.push({ heading: 'When it speaks loudest', kind: 'time', text: houseTiming(r, n, now) });
  const tone = toneOf(houseScore(r, n)), name = m.short === 'yourself' ? 'your own self' : `your house of ${m.short}`;
  sections.push({ heading: 'The thread', kind: 'thread', text: [6, 8, 12].includes(n) && (tone === 'blessed' || tone === 'strong') ? HARD_HOUSE_STRONG(name) : THREAD[tone](name) });
  return { title: `The ${ordinal(n)} house`, subtitle: cap(m.short), sections };
}

/* When a house comes to the front of life: the dashas of its lord and its planets, their maturing ages, and today's sky. */
function houseTiming(r: Reading, n: number, now: number): string {
  const h = r.houses[n - 1], all = mahadashas(r);
  const pick = (lord: string) => {
    const list = all.filter(p => p.lord === lord);
    return list.find(p => p.start <= now && p.end > now) ?? list.find(p => p.start > now) ?? list[list.length - 1];
  };
  const parts: string[] = [];
  const lp = pick(h.lord), sub = nextSub(r, h.lord, now);
  if (lp && lp.start <= now + 25 * 365.25 * 86400000) parts.push(`This house wakes most strongly in the period of its lord. Your ${h.lord} period ${when(r, lp, now)}.`);
  else if (lp) parts.push(`Its lord's own great period lies far ahead (it ${when(r, lp, now)}), so this house speaks through shorter chapters instead.`);
  if (sub) parts.push(`${sub.now ? 'Right now' : `From ${monthYear(sub.start)}`} ${the(h.lord)} has a sub-period inside your ${sub.within} years, ${sub.now ? `until ${monthYear(sub.end)}` : `until ${monthYear(sub.end)}, when you are ${ageAt(r, sub.start)}`}: ${sub.now ? 'this house is in the foreground now' : 'mark it as a season when this house comes forward'}.`);
  // the planets living here speak in their own periods: name the ones now or soon, at most two
  const soon = h.planets.filter(x => x.name !== h.lord).map(x => ({ name: x.name, p: pick(x.name) }))
    .filter(x => x.p && x.p.end > now && x.p.start < now + 25 * 365.25 * 86400000).sort((a, b) => a.p!.start - b.p!.start).slice(0, 2);
  for (const x of soon) parts.push(`${the(x.name, true)}'s period, which acts through this house, ${when(r, x.p!, now)}.`);
  const key = h.planets[0]?.name ?? h.lord;
  parts.push(maturityLine(r, key, now));
  const sky = todaySky(r, new Date(now)).transits.filter(t => t.house === n && t.name !== 'Moon');
  if (sky.length) parts.push(`And right now ${sky.map(t => `${the(t.name)} is passing through it, staying ${STAY[t.name]}`).join(', and ')}: the story of this house is moving today.`);
  return parts.join(' ');
}

/* ---------- the whole chart (all twelve houses cleared; Full reading) ---------- */
export function wholeChartReading(r: Reading, now = Date.now()): ReadingText {
  const scores = r.houses.map(h => ({ n: h.n, s: houseScore(r, h.n) })).sort((a, b) => b.s - a.s);
  // the houses of difficulty (6, 8, 12) can be strong without being where life "gives freely", so they are not named as the best
  const best = scores.filter(x => ![6, 8, 12].includes(x.n)).slice(0, 2), worst = scores.slice(-2).reverse();
  const short = (n: number) => HOUSE_MEANING[n - 1].short;
  const sections: Section[] = [];
  sections.push({
    heading: 'The shape of your chart',
    text: `Weighing every house the way a Jyotisha reader would (who lives there, how strong they are, who looks at it, and where its lord went), your strongest houses are your ${ordinal(best[0].n)}, ${short(best[0].n)}, and your ${ordinal(best[1].n)}, ${short(best[1].n)}. These are where life gives most freely. The houses that ask the most of you are your ${ordinal(worst[0].n)}, ${short(worst[0].n)}, and your ${ordinal(worst[1].n)}, ${short(worst[1].n)}: not bad houses, but the ones where your effort is the price and also the reward.`,
  });
  const l = r.houses[0];
  sections.push({ heading: `Your lagna lord's journey`, planet: l.lord, text: `${the(l.lord, true)}, ruler of your whole chart, travels to your ${ordinal(l.lordHouse)} house. Life keeps pulling you toward ${short(l.lordHouse)}: that is where you go to become yourself. ${placementNote(l.lordHouse)}` });
  const els: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) els[['fire', 'earth', 'air', 'water'][r.chart.by[p].sign % 4]]++;
  const top = Object.entries(els).sort((a, b) => b[1] - a[1])[0][0];
  const none = Object.entries(els).filter(e => e[1] === 0).map(e => e[0]);
  sections.push({ heading: 'Your element', text: `${ELEMENT_LINE[top]}${none.length ? ` You have no planets in ${none.join(' or ')}: ${none.includes('water') ? 'feelings may come to you through others' : none.includes('earth') ? 'practical matters may need deliberate attention' : none.includes('fire') ? 'drive may need to be borrowed from a cause you love' : 'words and ideas may need to be practised rather than assumed'}.` : ''}` });
  const born = chartYogas(r);
  sections.push({ heading: born.length ? 'Yogas you were born with' : 'Yogas', text: born.length ? born.map(id => YOGA_PAGE[id]).join(' ') : 'None of the nine yogas in this game form in your birth chart. That is common, and your chart\'s strength lies in its houses rather than in planets pairing up.' });
  const p = nowPeriods(r, now);
  if (p) {
    const list = mahadashas(r), i = list.findIndex(x => x.lord === p.md.lord && x.start <= now && x.end > now), next = list[i + 1];
    sections.push({ heading: 'Where you are in time', kind: 'now', planet: p.md.lord, text: `${DASHA_TEXT[p.md.lord].text} Yours ${when(r, p.md, now)}. ${periodInYourChart(r, p.md.lord)}${next ? ` After it comes your ${next.lord} period, from ${yearOf(next.start)}, when you are ${ageAt(r, next.start)}: ${DASHA_TEXT[next.lord].tone}.` : ''}` });
  }
  const moonNak = NAKSHATRAS[nakOf(r.chart.by.Moon.lon)];
  sections.push({ heading: 'The thread of your life', kind: 'thread', text: `${r.timeKnown ? `You meet the world as a ${SIGNS[r.lagnaSign]} rising, ` : ''}feel things as a Moon in ${SIGNS[r.chart.by.Moon.sign]}, and were born under ${moonNak.name}, ${moonNak.key}. Your chart's light falls most on ${short(best[0].n)}, and its hardest work is in ${short(worst[0].n)}. Read together, it says: lean on what is given, work patiently at what is not, and trust the timing. Your houses are not a verdict. They are the shape of the walk.` });
  return { title: 'The whole chart', subtitle: 'All twelve houses, read together', sections };
}

/* ---------- the dasha timeline (Full reading) ---------- */
export function dashaTimeline(r: Reading, now = Date.now()) {
  return mahadashas(r).map(p => ({
    lord: p.lord, start: p.start, end: p.end, now: p.start <= now && p.end > now, past: p.end <= now,
    from: yearOf(p.start), to: yearOf(p.end), ageFrom: ageAt(r, p.start), ageTo: ageAt(r, p.end),
    text: DASHA_TEXT[p.lord].text, yours: periodInYourChart(r, p.lord),
    sub: p.sub.filter(s => s.end > r.utc).map(s => ({ lord: s.lord, start: Math.max(s.start, r.utc), end: s.end, now: s.start <= now && s.end > now, tone: ANTAR_TONE[s.lord] })),
  }));
}
