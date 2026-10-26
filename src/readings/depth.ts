/* What makes a house reading about one person: the sign each planet works through, the planets that
   look at the house (Vedic aspects), the guests crossing it today, and a closing thread that weighs it all.
   For entertainment and self-reflection. */
import type { Reading } from '../seed';
import { ordinal } from '../seed';

/* "In Scorpio, it ..." */
export const SIGN_FLAVOUR: string[] = [
  'it acts fast, alone and without asking permission',
  'it works slowly and steadily, and wants something it can keep',
  'it talks, questions and does two things at once',
  'it works through feeling, memory and the wish to protect',
  'it wants to be seen and to lead from the centre',
  'it is careful, exact and useful, and worries about getting it right',
  'it seeks balance, fairness and a partner to share it with',
  'it goes deep, works in private and does nothing by halves',
  'it aims far, speaks its truth and needs room to roam',
  'it is patient, ambitious and builds one step at a time',
  'it thinks for itself and works best with the group, at a distance',
  'it is soft, intuitive and dissolves into whatever it touches',
];

/* Which houses a planet looks at from where it sits (Parashari drishti; the nodes are left out). */
export function aspectsFrom(planet: string, house: number): number[] {
  const steps = [7, ...(planet === 'Mars' ? [4, 8] : planet === 'Jupiter' ? [5, 9] : planet === 'Saturn' ? [3, 10] : [])];
  if (planet === 'Rahu' || planet === 'Ketu') return [];
  return steps.map(s => ((house - 1 + s - 1) % 12) + 1);
}
export function aspectsOn(r: Reading, n: number): { planet: string; from: number }[] {
  const out: { planet: string; from: number }[] = [];
  for (const h of r.houses) for (const p of h.planets) if (aspectsFrom(p.name, h.n).includes(n)) out.push({ planet: p.name, from: h.n });
  return out;
}
export const GAZE: Record<string, string> = {
  Sun: 'adds heat and pride, and puts this part of life in the spotlight',
  Moon: 'softens it and makes it changeable, tied to your moods and to the people around you',
  Mars: 'brings energy and friction: things here move fast, and sometimes collide',
  Mercury: 'makes it busy with talk, ideas and small dealings',
  Jupiter: 'protects and widens it; this is the most welcome gaze in a chart',
  Venus: 'sweetens it with charm, comfort and good taste',
  Saturn: 'slows it down and makes it serious, so it comes late but lasts',
};

/* Today's planets passing through a house, and roughly how long each one stays. */
export const STAY: Record<string, string> = {
  Sun: 'about a month', Moon: 'two or three days', Mars: 'six weeks or so', Mercury: 'about three weeks', Jupiter: 'about a year',
  Venus: 'about a month', Saturn: 'two and a half years', Rahu: 'a year and a half', Ketu: 'a year and a half',
};

/* Weigh a house: who is in it, how strong they are, who looks at it, and where its lord went. */
const BENEFIC: Record<string, number> = { Jupiter: 2, Venus: 1.5, Mercury: 1, Moon: 1 };
const MALEFIC: Record<string, number> = { Saturn: 1, Mars: 1, Rahu: 1, Ketu: 0.5, Sun: 0.5 };
const DIGNITY: Record<string, number> = { exalted: 1, 'own sign': 0.75, debilitated: -1 };
export function houseScore(r: Reading, n: number): number {
  const h = r.houses[n - 1], upachaya = [3, 6, 11].includes(n);
  let s = 0;
  for (const p of h.planets) {
    s += BENEFIC[p.name] ?? 0;
    if (MALEFIC[p.name]) s += upachaya ? 0.75 : -MALEFIC[p.name];
    s += DIGNITY[p.dignity] ?? 0;
  }
  for (const a of aspectsOn(r, n)) s += a.planet === 'Jupiter' ? 1.5 : a.planet === 'Venus' ? 0.5 : a.planet === 'Saturn' || a.planet === 'Mars' ? (upachaya ? 0.25 : -0.75) : 0;
  const to = h.lordHouse, dust = [6, 8, 12];
  if ([1, 4, 5, 7, 9, 10].includes(to)) s += 1;
  else if (dust.includes(to)) s += dust.includes(n) ? 0.5 : -1; // a hard house's lord in a hard house cancels out (viparita)
  else if (to === 2 || to === 11) s += 0.5;
  s += DIGNITY[r.chart.by[h.lord].dignity] ?? 0;
  return Math.round(s * 4) / 4;
}

export type Tone = 'blessed' | 'strong' | 'mixed' | 'tested' | 'forged';
export const toneOf = (s: number): Tone => (s >= 3 ? 'blessed' : s >= 1 ? 'strong' : s > -1 ? 'mixed' : s > -3 ? 'tested' : 'forged');
export const THREAD: Record<Tone, (short: string) => string> = {
  blessed: s => `Taken together, ${s} is one of the brightest rooms in your chart. What you put in here comes back more than doubled, and when life is hard elsewhere, this is where you can stand.`,
  strong: s => `Taken together, ${s} is a strong, supported part of your life. It does not need forcing: keep showing up for it, and it keeps giving.`,
  mixed: s => `Taken together, ${s} holds both gifts and lessons. Some years it flows and some years it asks for work, and knowing which kind of year you are in is half the art.`,
  tested: s => `Taken together, ${s} is where your chart asks the most of you. It may come late or only with effort, and that is exactly why, when it comes, it is yours and no one can take it away.`,
  forged: s => `Taken together, ${s} is the forge of your chart. The pressure here is real, and so is what it makes: people with this pattern often become the ones others turn to in exactly this part of life.`,
};

/* A house of difficulty (6th, 8th, 12th) that is well supported is strong in its own way. */
export const HARD_HOUSE_STRONG = (s: string) => `Taken together, ${s} is strong in the way a hard house should be. What comes against you here, you outlast; what others find heavy, you carry well. This is a quiet strength people only see when it is needed.`;

/* The four elements across the nine planets, for the whole-chart reading. */
export const ELEMENT_LINE: Record<string, string> = {
  fire: 'Most of your planets sit in fire signs. You run on spirit, drive and conviction: you need a cause, and you light other people up.',
  earth: 'Most of your planets sit in earth signs. You run on what is real and lasting: work, money, the body, things you can build and keep.',
  air: 'Most of your planets sit in air signs. You run on ideas, words and people: you need conversation and freedom of thought.',
  water: 'Most of your planets sit in water signs. You run on feeling, intuition and memory: you know things before you can explain them.',
};

export const houseWord = (n: number) => `your ${ordinal(n)} house`;
