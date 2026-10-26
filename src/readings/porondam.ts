/* Porondam, the Sri Lankan match: the dasa porondam, the ten core points, counted from the bride's
   birth star to the groom's, as Sinhala and Tamil tradition do. Rajju and Yoni are the ones tradition
   treats most seriously. Kuja dosha (Mars) is checked the Sinhala way, from the lagna and the Moon.
   For entertainment and self-reflection. */
import { nakOf } from './nakshatras';
import type { Reading } from '../seed';

export type Result = 'yes' | 'half' | 'no';
export type Point = { id: string; name: string; sinhala: string; result: Result; essential?: boolean; text: string };
type Side = { nak: number; sign: number };

const LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const FRIENDS: Record<string, [string[], string[]]> = {
  Sun: [['Moon', 'Mars', 'Jupiter'], ['Venus', 'Saturn']], Moon: [['Sun', 'Mercury'], []], Mars: [['Sun', 'Moon', 'Jupiter'], ['Mercury']],
  Mercury: [['Sun', 'Venus'], ['Moon']], Jupiter: [['Sun', 'Moon', 'Mars'], ['Mercury', 'Venus']], Venus: [['Mercury', 'Saturn'], ['Sun', 'Moon']],
  Saturn: [['Mercury', 'Venus'], ['Sun', 'Moon', 'Mars']],
};
const GANA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0]; // deva, manushya, rakshasa
const YONI = ['horse', 'elephant', 'sheep', 'serpent', 'serpent', 'dog', 'cat', 'sheep', 'cat', 'rat', 'rat', 'cow', 'buffalo', 'tiger', 'buffalo', 'tiger', 'deer', 'deer', 'dog', 'monkey', 'mongoose', 'monkey', 'lion', 'horse', 'lion', 'cow', 'elephant'];
const SWORN = [['horse', 'buffalo'], ['elephant', 'lion'], ['sheep', 'monkey'], ['serpent', 'mongoose'], ['dog', 'deer'], ['cat', 'rat'], ['cow', 'tiger']];
/* The five rajju (cords of the body): foot, waist, navel, neck, head */
const RAJJU = [0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0];
const RAJJU_NAME = ['Pada (foot)', 'Kati (waist)', 'Nabhi (navel)', 'Kantha (neck)', 'Siro (head)'];
/* Vedha: pairs of stars that strike each other */
const VEDHA: [number, number][] = [[0, 17], [1, 16], [2, 15], [3, 14], [5, 21], [6, 20], [7, 19], [8, 18], [9, 26], [10, 25], [11, 24], [12, 23], [4, 13], [4, 22], [13, 22]];
/* Vashya signs: the signs each sign draws toward it */
const VASHYA: number[][] = [[4, 7], [3, 6], [5], [7, 8], [6], [11, 2], [9, 5], [3], [11], [0, 10], [0], [9]];

const count = (from: number, to: number, n: number) => ((to - from + n) % n) + 1;

export function porondam(bride: Side, groom: Side): { points: Point[]; score: number } {
  const p: Point[] = [];
  const nk = count(bride.nak, groom.nak, 27);

  // 1. Nakath (dina): the count from her star to his, divided by 9, leaves 2, 4, 6, 8 or 0
  p.push({ id: 'nakath', name: 'Nakath', sinhala: 'නැකත්', result: [0, 2, 4, 6, 8].includes(nk % 9) ? 'yes' : 'no', text: '' });
  // 2. Gana
  const gb = GANA[bride.nak], gg = GANA[groom.nak];
  p.push({ id: 'gana', name: 'Gana', sinhala: 'ගණ', result: gb === gg ? 'yes' : gb !== 2 && gg !== 2 ? 'half' : 'no', text: '' });
  // 3. Mahendra: his star is the 4th, 7th, 10th ... from hers
  p.push({ id: 'mahendra', name: 'Mahendra', sinhala: 'මහේන්ද්‍ර', result: [4, 7, 10, 13, 16, 19, 22, 25].includes(nk) ? 'yes' : 'no', text: '' });
  // 4. Stree deergha: his star well beyond hers
  p.push({ id: 'deergha', name: 'Stree Deergha', sinhala: 'ස්ත්‍රී දීර්ඝ', result: nk > 13 ? 'yes' : nk >= 7 ? 'half' : 'no', text: '' });
  // 5. Yoni (essential)
  const yb = YONI[bride.nak], yg = YONI[groom.nak], sworn = SWORN.some(([a, b]) => (a === yb && b === yg) || (a === yg && b === yb));
  p.push({ id: 'yoni', name: 'Yoni', sinhala: 'යෝනි', essential: true, result: yb === yg ? 'yes' : sworn ? 'no' : 'half', text: '' });
  // 6. Rashi: his Moon sign the same as hers, or the 7th or beyond (but not the 8th)
  const rs = count(bride.sign, groom.sign, 12);
  p.push({ id: 'rashi', name: 'Rashi', sinhala: 'රාශි', result: rs === 1 || (rs >= 7 && rs !== 8) ? 'yes' : 'no', text: '' }); // 8th is the 6/8 pair, read as hard
  // 7. Rashyadhipathi: the lords of the two Moon signs
  const lb = LORD[bride.sign], lg = LORD[groom.sign];
  const rel = (a: string, b: string) => (a === b || FRIENDS[a][0].includes(b) ? 2 : FRIENDS[a][1].includes(b) ? 0 : 1);
  const r2 = rel(lb, lg) + rel(lg, lb);
  p.push({ id: 'adhipathi', name: 'Rashyadhipathi', sinhala: 'රාශ්‍යාධිපති', result: r2 >= 3 ? 'yes' : r2 >= 2 ? 'half' : 'no', text: '' });
  // 8. Vashya
  p.push({ id: 'vashya', name: 'Vashya', sinhala: 'වශ්‍ය', result: VASHYA[bride.sign].includes(groom.sign) || VASHYA[groom.sign].includes(bride.sign) ? 'yes' : 'no', text: '' });
  // 9. Rajju (essential): the two stars must not share a cord
  p.push({ id: 'rajju', name: 'Rajju', sinhala: 'රජ්ජු', essential: true, result: RAJJU[bride.nak] === RAJJU[groom.nak] ? 'no' : 'yes', text: '' });
  // 10. Vedha: the two stars must not strike each other
  const vedha = VEDHA.some(([a, b]) => (a === bride.nak && b === groom.nak) || (a === groom.nak && b === bride.nak));
  p.push({ id: 'vedha', name: 'Vedha', sinhala: 'වේධ', result: vedha ? 'no' : 'yes', text: '' });

  for (const x of p) x.text = PORONDAM_TEXT[x.id][x.result === 'yes' ? 0 : x.result === 'half' ? 1 : 2];
  const rj = p.find(x => x.id === 'rajju')!;
  if (rj.result === 'no') rj.text += ` Both stars sit on ${RAJJU_NAME[RAJJU[bride.nak]]} rajju.`;
  const score = p.reduce((s, x) => s + (x.result === 'yes' ? 1 : x.result === 'half' ? 0.5 : 0), 0);
  return { points: p, score };
}

export const sideOf = (r: Reading): Side => ({ nak: nakOf(r.chart.by.Moon.lon), sign: r.chart.by.Moon.sign });

/* [obtained, partly, not obtained] */
export const PORONDAM_TEXT: Record<string, [string, string, string]> = {
  nakath: ['The two stars count well from each other: daily life together tends to run smoothly.', '', 'The two stars count awkwardly: everyday rhythms may clash, and small things need patience.'],
  gana: ['Your star temperaments match: you want similar things from life.', 'Your temperaments differ but sit well together, one gentler than the other.', 'One star is fierce (rakshasa) and the other is not: tempers need room and kindness.'],
  mahendra: ['Mahendra is obtained: tradition reads it as growth, children and a family that prospers.', '', 'Mahendra is not obtained. It is a point of blessing rather than danger, and many good matches do without it.'],
  deergha: ['Stree Deergha is obtained: tradition reads it as long life and well-being for the bride.', 'Stree Deergha is partly obtained.', 'Stree Deergha is not obtained. It is weighed lightly when the essential points hold.'],
  yoni: ['Your star animals agree: closeness and physical harmony come naturally.', 'Your star animals are different but not enemies: closeness is learned rather than automatic.', 'Your star animals are sworn enemies. Tradition takes yoni seriously; look at both full charts before deciding anything.'],
  rashi: ['Your Moon signs sit in a good relation: home life and family tend to grow.', '', 'Your Moon signs sit in a hard count from each other: family life asks for extra care.'],
  adhipathi: ['The lords of your Moon signs are friends: your minds meet easily.', 'The lords of your Moon signs are neutral to each other.', 'The lords of your Moon signs are at odds: you see the world differently, and respect bridges it.'],
  vashya: ['One Moon sign draws the other: there is natural attraction and mutual pull.', '', 'Neither Moon sign naturally draws the other: you choose each other on purpose.'],
  rajju: ['Rajju is obtained: the two stars sit on different cords, the most important point for a long and safe marriage.', '', 'Rajju is not obtained: both stars share one cord. Sinhala tradition takes this very seriously, and families usually consult an astrologer on the whole charts.'],
  vedha: ['No vedha: the two stars do not strike each other.', '', 'Vedha: the two stars strike each other, which tradition reads as friction that must be soothed.'],
};

/* Kuja dosha, the Sinhala way: Mars in the 1st, 2nd, 4th, 7th, 8th or 12th, counted from the lagna and from the Moon.
   It is cancelled when Mars is in its own or exalted sign. Two charts are balanced when both or neither carry it. */
export function kujaDosha(r: Reading): { has: boolean; from: string[] } {
  const mars = r.chart.by.Mars;
  if (mars.dignity === 'own sign' || mars.dignity === 'exalted') return { has: false, from: [] };
  const bad = [1, 2, 4, 7, 8, 12], from: string[] = [];
  if (r.timeKnown && bad.includes(count(r.lagnaSign, mars.sign, 12))) from.push('the lagna');
  if (bad.includes(count(r.chart.by.Moon.sign, mars.sign, 12))) from.push('the Moon');
  return { has: from.length > 0, from };
}

export function porondamBand(score: number, essentialOk: boolean): { name: string; text: string } {
  if (!essentialOk) return { name: 'An essential point is missing', text: 'Rajju or Yoni is not obtained. Whatever the total, Sri Lankan tradition asks for these two first, so this match is usually taken to an astrologer to read both full charts.' };
  if (score >= 8) return { name: 'A very good porondam', text: 'Most of the ten points are obtained, including the essential ones. By the old measure, this is a well-matched pair.' };
  if (score >= 6) return { name: 'A good porondam', text: 'More than half the points are obtained, and the essential ones hold. This is what tradition looks for.' };
  return { name: 'A weak porondam', text: 'Fewer than half the points are obtained, though the essential ones hold. Families often look at the full charts before deciding.' };
}
