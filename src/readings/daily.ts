/* One line for the day, from where today's Moon stands counted from your birth Moon (the 12 Moon days
   of gochara), plus the nakshatra the Moon is passing through today. For entertainment and self-reflection. */
import { NAKSHATRAS, nakOf } from './nakshatras';

export const DAILY_LINE: string[] = [
  'The Moon returns to where it stood when you were born: you feel more like yourself today, and others notice. A good day to begin something that is yours.',
  'The Moon passes your house of money and speech: words carry weight today, and so do small purchases. Say the kind thing, and spend with care.',
  'The Moon lends you courage: reach out, send the message, try the thing you have been putting off. Effort pays quickly today.',
  'The Moon settles over home: you may want quiet, family and comfort more than company. Listen to that; rest is work too.',
  'The Moon lights your house of joy: play, create, flirt, learn. Anything done for love rather than duty goes well.',
  'The Moon walks through your house of struggle: small irritations and tiredness come easily today. Tidy one thing, rest early, and let the rest wait.',
  'The Moon faces you from your 7th: today belongs to other people. Partners, friends and even rivals have something to show you.',
  'Chandrashtama: the Moon is 8th from where you were born. Feelings run deep and plans go sideways, so go gently, avoid big decisions, and be kind to yourself.',
  'The Moon blesses your house of fortune: a good day for faith, teachers, long views and lucky chances. Say yes to something that widens you.',
  'The Moon rises over your house of work: what you do today is seen. Show up fully; it counts more than usual.',
  'The Moon passes your house of gains: help arrives, friends call, wishes move a step closer. Ask for what you want.',
  'The Moon drifts through your 12th: energy is low and the mind turns inward. Sleep, meditate, let something go; tomorrow you begin again.',
];

export function dailyLine(fromMoon: number, moonLon: number): string {
  const n = NAKSHATRAS[nakOf(moonLon)];
  return `${DAILY_LINE[fromMoon - 1]} Today the Moon travels through ${n.name}, ${n.key}.`;
}
