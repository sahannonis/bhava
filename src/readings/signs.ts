/* The twelve signs (rashis) and the nine yogas, for the Book of the Sky,
   and how to find each yoga in a real birth chart. Drafts for Sahan to edit. */
import type { Reading } from '../seed';

export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
export const SIGN_SANSKRIT = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
export const SIGN_LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const ELEMENT = ['fire', 'earth', 'air', 'water'];
const MODE = ['moving (chara)', 'fixed (sthira)', 'dual (dvisvabhava)'];

export const SIGN_TEXT: string[] = [
  'Aries, the ram, is the first sign: fresh starts, courage and speed. It is bold, direct and impatient, the spark that begins the zodiac.',
  'Taurus, the bull: patience, comfort, beauty and things that last. It is steady, sensual and stubborn, and it holds on to what it values.',
  'Gemini, the pair: talk, curiosity, trade and play. It is quick, clever and restless, always looking at both sides.',
  'Cancer, the crab: home, care, memory and feeling. It is protective and tender, hard outside and soft within.',
  'Leo, the lion: pride, warmth, leadership and play. It is generous and loyal, and it wants to be seen.',
  'Virgo, the maiden: care, craft, health and service. It is careful and exact, and it makes things work properly.',
  'Libra, the scales: balance, fairness, beauty and partnership. It is graceful and diplomatic, and it weighs everything.',
  'Scorpio, the scorpion: depth, intensity, secrets and change. It is private and loyal, and it does nothing by halves.',
  'Sagittarius, the archer: faith, truth, freedom and far horizons. It is honest and optimistic, always aiming further.',
  'Capricorn, the sea-goat: duty, patience, ambition and structure. It climbs slowly and reaches the top.',
  'Aquarius, the water-bearer: ideas, groups, freedom and the new. It is independent and humane, a little apart from the crowd.',
  'Pisces, the fish: dreams, compassion, faith and release. It is gentle and imaginative, the last sign, where everything dissolves.',
];
export const signFacts = (i: number) => `${SIGN_SANSKRIT[i]} · a ${ELEMENT[i % 4]} sign · ${MODE[i % 3]} · ruled by ${SIGN_LORD[i]}`;

export const YOGA_PAGE: Record<string, string> = {
  budhaditya: 'Budhaditya Yoga forms when the Sun and Mercury sit together. The light of the self shines on the mind: it is said to give intelligence, clear speech and success in learning. It is common, since Mercury never strays far from the Sun.',
  gajakesari: 'Gajakesari Yoga, "the elephant and the lion", forms when Jupiter sits in a kendra (1st, 4th, 7th or 10th) counted from the Moon. It is said to give lasting fame, wisdom and protection, like an elephant that a lion cannot move.',
  chandraMangala: 'Chandra-Mangala Yoga forms when the Moon and Mars sit together. Feeling is joined to drive: it is said to give a talent for earning and the energy to act on what you feel.',
  guruMangala: 'Guru-Mangala Yoga forms when Jupiter and Mars sit together. Wisdom guides courage: it is said to give righteous action, leadership and success in fields that need both brains and nerve.',
  lakshmiNarayana: 'Lakshmi-Narayana Yoga forms when Venus and Mercury sit together, named for the goddess of wealth and her consort. It is said to give charm, skill, artistic talent and comfortable living.',
  shukraShani: 'Venus and Saturn together join beauty with time. It is said to give lasting love, artistic discipline and wealth that grows slowly, though love may come late or with duty attached.',
  'surya-shani': 'The Sun and Saturn are father and son in the old stories, and enemies. Together they form one of the patterns called Pitri Dosha: a strain between authority and duty, often seen in the relationship with the father, that softens with patience and respect.',
  grahan: 'Grahan Yoga, the eclipse, forms when Rahu or Ketu sits with the Sun or the Moon. The light is partly swallowed: it is said to bring confusion or intensity around the self or the mind, and great depth to those who work with it.',
  ketuMoksha: 'Ketu with Jupiter joins release to wisdom. It is said to give spiritual insight, a teacher\'s understanding without pride, and an easy letting-go of what does not matter.',
};

/* Which of the nine yogas a real birth chart holds (by sign, the classic simple test). */
export function chartYogas(r: Reading): string[] {
  const sign = (p: string) => r.chart.by[p].sign;
  const together = (a: string, b: string) => sign(a) === sign(b);
  const out: string[] = [];
  if (together('Sun', 'Mercury')) out.push('budhaditya');
  const fromMoon = ((sign('Jupiter') - sign('Moon') + 12) % 12) + 1;
  if ([1, 4, 7, 10].includes(fromMoon)) out.push('gajakesari');
  if (together('Moon', 'Mars')) out.push('chandraMangala');
  if (together('Jupiter', 'Mars')) out.push('guruMangala');
  if (together('Venus', 'Mercury')) out.push('lakshmiNarayana');
  if (together('Venus', 'Saturn')) out.push('shukraShani');
  if (together('Sun', 'Saturn')) out.push('surya-shani');
  if (['Sun', 'Moon'].some(l => together('Rahu', l) || together('Ketu', l))) out.push('grahan');
  if (together('Ketu', 'Jupiter')) out.push('ketuMoksha');
  return out;
}
