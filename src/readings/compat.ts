/* Compatibility by Ashtakoota, the classic 36-point Vedic match.
   It compares the two birth Moons: their signs and their nakshatras.
   The old rules score some parts differently for bride and groom; this game reads without gender,
   so where the two directions differ it takes the kinder score, and says so.
   For entertainment and self-reflection. */
import { nakOf } from './nakshatras';

export type Moon = { sign: number; lon: number };
export type Koota = { id: string; name: string; max: number; score: number; text: string };

const LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

/* 2. Vashya: the kind of creature the Moon sign is */
function vashyaGroup(m: Moon): number {
  const deg = m.lon % 30;
  switch (m.sign) {
    case 0: case 1: return 0;             // four-footed
    case 2: case 5: case 6: case 10: return 1; // human
    case 3: case 11: return 2;            // water
    case 4: return 3;                     // wild
    case 7: return 4;                     // insect
    case 8: return deg < 15 ? 1 : 0;      // Sagittarius: human, then four-footed
    case 9: return deg < 15 ? 0 : 2;      // Capricorn: four-footed, then water
  }
  return 1;
}
const VASHYA = [
  [2, 1, 1, 0.5, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [0.5, 0, 1, 2, 0],
  [1, 1, 1, 0, 2],
];
/* 4. Yoni: each nakshatra's animal. Scored simply: same animal 4, friends 3, sworn enemies 0, the rest 2 (close to the classic table). */
const YONI = ['horse', 'elephant', 'sheep', 'serpent', 'serpent', 'dog', 'cat', 'sheep', 'cat', 'rat', 'rat', 'cow', 'buffalo', 'tiger', 'buffalo', 'tiger', 'deer', 'deer', 'dog', 'monkey', 'mongoose', 'monkey', 'lion', 'horse', 'lion', 'cow', 'elephant'];
const SWORN = [['horse', 'buffalo'], ['elephant', 'lion'], ['sheep', 'monkey'], ['serpent', 'mongoose'], ['dog', 'deer'], ['cat', 'rat'], ['cow', 'tiger']];
const FRIENDLY = [['horse', 'deer'], ['elephant', 'sheep'], ['cow', 'buffalo'], ['deer', 'cow'], ['monkey', 'deer'], ['lion', 'tiger']];
/* 5. Graha maitri: friendship of the two Moon-sign lords */
const FRIENDS: Record<string, [string[], string[]]> = { // [friends, enemies]; the rest are neutral
  Sun: [['Moon', 'Mars', 'Jupiter'], ['Venus', 'Saturn']],
  Moon: [['Sun', 'Mercury'], []],
  Mars: [['Sun', 'Moon', 'Jupiter'], ['Mercury']],
  Mercury: [['Sun', 'Venus'], ['Moon']],
  Jupiter: [['Sun', 'Moon', 'Mars'], ['Mercury', 'Venus']],
  Venus: [['Mercury', 'Saturn'], ['Sun', 'Moon']],
  Saturn: [['Mercury', 'Venus'], ['Sun', 'Moon', 'Mars']],
};
const rel = (a: string, b: string) => (a === b ? 2 : FRIENDS[a][0].includes(b) ? 2 : FRIENDS[a][1].includes(b) ? 0 : 1);
/* 6. Gana: divine, human or fierce temperament of the nakshatra */
const GANA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];
/* 8. Nadi: the three pulses */
const NADI = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];

export function ashtakoota(a: Moon, b: Moon): { kootas: Koota[]; total: number } {
  const na = nakOf(a.lon), nb = nakOf(b.lon);
  const k: Koota[] = [];

  // read without gender, the kinder direction always meets Varna's rule, so it always scores
  k.push({ id: 'varna', name: 'Varna, temperament', max: 1, score: 1, text: '' });

  const va = vashyaGroup(a), vb = vashyaGroup(b);
  k.push({ id: 'vashya', name: 'Vashya, natural pull', max: 2, score: Math.max(VASHYA[va][vb], VASHYA[vb][va]), text: '' });

  const fwd = ((nb - na + 27) % 27) % 9, back = ((na - nb + 27) % 27) % 9;
  const good = (x: number) => ![2, 4, 6].includes(x); // the 3rd, 5th and 7th stars from each other are the hard ones
  k.push({ id: 'tara', name: 'Tara, fortune of the stars', max: 3, score: (good(fwd) ? 1.5 : 0) + (good(back) ? 1.5 : 0), text: '' });

  const ya = YONI[na], yb = YONI[nb];
  const pair = (l: string[][]) => l.some(([x, y]) => (x === ya && y === yb) || (x === yb && y === ya));
  k.push({ id: 'yoni', name: 'Yoni, closeness and instinct', max: 4, score: ya === yb ? 4 : pair(SWORN) ? 0 : pair(FRIENDLY) ? 3 : 2, text: '' });

  const la = LORD[a.sign], lb = LORD[b.sign], r1 = rel(la, lb), r2 = rel(lb, la);
  const maitri = la === lb ? 5 : r1 + r2 === 4 ? 5 : r1 + r2 === 3 ? 4 : r1 + r2 === 2 ? (r1 === 1 ? 3 : 1) : r1 + r2 === 1 ? 0.5 : 0;
  k.push({ id: 'maitri', name: 'Graha Maitri, friendship of minds', max: 5, score: maitri, text: '' });

  const ga = GANA[na], gb = GANA[nb], gp = [ga, gb].sort().join('');
  k.push({ id: 'gana', name: 'Gana, temperament of the stars', max: 6, score: ga === gb ? 6 : gp === '01' ? 6 : gp === '02' ? 1 : 0, text: '' });

  const dist = ((b.sign - a.sign + 12) % 12) + 1, pairDist = [dist, ((a.sign - b.sign + 12) % 12) + 1].sort((x, y) => x - y).join('/');
  const bhakootBad = ['2/12', '5/9', '6/8'].includes(pairDist);
  k.push({ id: 'bhakoot', name: 'Bhakoot, the family and its prosperity', max: 7, score: bhakootBad ? 0 : 7, text: '' });

  k.push({ id: 'nadi', name: 'Nadi, health and the next generation', max: 8, score: NADI[na] === NADI[nb] ? 0 : 8, text: '' });

  for (const x of k) x.text = KOOTA_TEXT[x.id][x.score >= x.max * 0.75 ? 0 : x.score > 0 ? 1 : 2];
  return { kootas: k, total: k.reduce((s, x) => s + x.score, 0) };
}

/* [good, partial, none] for each part */
export const KOOTA_TEXT: Record<string, [string, string, string]> = {
  varna: ['Your basic natures can respect each other\'s way of working.', 'Your basic natures work in different ways.', 'Your basic natures pull in different directions.'],
  vashya: ['There is a natural pull between you: you are easily drawn into each other\'s orbit.', 'There is some pull between you, though one of you leads more than the other.', 'Neither of you is easily swayed by the other: you will have to choose each other on purpose.'],
  tara: ['Your birth stars bless each other: good fortune tends to arrive when you are together.', 'Your birth stars bless one direction more than the other: one of you lifts the other more.', 'Your birth stars sit awkwardly: timing between you can feel off, and patience fixes much of it.'],
  yoni: ['Your instincts match: closeness comes naturally, and you understand each other without words.', 'Your instincts are different but not opposed: closeness is learned rather than automatic.', 'Your birth animals are old rivals: your instincts clash, and tenderness has to be practised.'],
  maitri: ['The lords of your Moon signs are friends: your minds get along, and conversation is easy.', 'The lords of your Moon signs are only partly friendly: you think differently, and that can be useful.', 'The lords of your Moon signs are at odds: you see the world differently, and respect has to bridge it.'],
  gana: ['Your temperaments match: you want similar things from daily life.', 'Your temperaments differ a little: one of you is gentler, one fiercer.', 'Your temperaments are far apart: one of you is gentle and one is fierce, and both need room.'],
  bhakoot: ['Your Moon signs sit in a happy relation: home, money and family life tend to grow.', 'Your Moon signs sit in a mixed relation for home and family.', 'Your Moon signs sit in a hard relation (Bhakoot dosha): family life and money ask for extra care and good communication.'],
  nadi: ['You were born in different nadis, the best result: health and the next generation are favoured.', 'Your nadis partly meet.', 'You share the same nadi (Nadi dosha), which tradition takes seriously for health and children. Many families look at the whole charts before deciding, and so should you.'],
};

export function band(total: number): { name: string; text: string } {
  if (total >= 33) return { name: 'An excellent match', text: 'A rare and fortunate score. By the old measure, you support each other in almost every way.' };
  if (total >= 25) return { name: 'A very good match', text: 'A strong score. The old measure sees real harmony between you, with a few places to be gentle.' };
  if (total >= 18) return { name: 'A workable match', text: 'An average score, and the threshold tradition asks for. There is enough harmony to build on, and some real differences to respect.' };
  return { name: 'A challenging match', text: 'Below the 18 points tradition looks for. This is not a verdict on love, which no table can measure, but a sign that the two of you will need more patience and understanding than most.' };
}
