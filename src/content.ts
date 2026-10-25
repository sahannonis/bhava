/* Game words and rules drawn from the chart. Names are working names until Sahan writes the lore;
   numbers are first drafts, balanced on Day 12. */
import type { HouseKind } from './seed';

/* The nine planet enemies (Day 5 gives them moves). */
export const ENEMIES: Record<string, { name: string; nature: string }> = {
  Sun: { name: 'The Pale King', nature: 'pride that burns what kneels to it' },
  Moon: { name: 'The Tide Mother', nature: 'a mood that rises and pulls away' },
  Mars: { name: 'The Red Spear', nature: 'anger that strikes first' },
  Mercury: { name: 'The Twin Tongue', nature: 'a mind that talks in circles' },
  Jupiter: { name: 'The Hollow Teacher', nature: 'wisdom grown proud of itself' },
  Venus: { name: 'The Silk Veil', nature: 'desire that softens the will' },
  Saturn: { name: 'The Grey Warden', nature: 'fear that keeps every door shut' },
  Rahu: { name: 'The Hungry Head', nature: 'craving that is never full' },
  Ketu: { name: 'The Headless One', nature: 'a past that walks without looking' },
};

/* Each house's sign sets the ground the fight happens on. The rule works for both sides. */
export const GROUND: Record<string, { name: string; rule: string }> = {
  fire: { name: 'Burning ground', rule: 'The first attack each turn also burns the target for 2.' },
  earth: { name: 'Heavy ground', rule: 'Block is not lost at the end of a turn.' },
  air: { name: 'Open sky', rule: 'Everyone draws one more card each turn.' },
  water: { name: 'Healing tide', rule: 'Everyone heals 2 at the end of each turn.' },
};

/* An empty house's lord decides what its rest place gives on top of rest, upgrade and buy. */
export const REST_GIFT: Record<string, string> = {
  Sun: 'Upgrade a card for free.',
  Moon: 'Resting heals half your health, not a third.',
  Mars: 'Cut a card from your deck for free.',
  Mercury: 'Cards here cost a quarter less prana.',
  Jupiter: 'Choose from four cards instead of three.',
  Venus: 'Rest, and also gain 10 prana.',
  Saturn: 'Gain 4 max health for the rest of the run.',
};

export const KIND_NAME: Record<HouseKind, string> = { fight: 'Fight', boss: 'Boss', rest: 'Rest place', gate: 'Final gate' };

/* Today's Moon, counted from your birth Moon: one effect for the day. Titles are filled in by today.ts. */
export const MOON_DAY: { effect: string }[] = [
  { effect: 'You start the run with 5 more max health.' },
  { effect: 'Fights give 10% more prana.' },
  { effect: 'The first card you play in each fight costs no breath.' },
  { effect: 'Rest places heal half as much again.' },
  { effect: 'After each fight, pick from one more card.' },
  { effect: 'Enemies start each fight with 10% less health.' },
  { effect: 'Bosses have 10% more health but give half as much karma again.' },
  { effect: 'Karma earned is up a quarter, but enemies hit 1 harder.' },
  { effect: 'You start the run with one card already upgraded.' },
  { effect: 'Your attacks deal 1 more damage.' },
  { effect: 'All prana you gain is up a quarter.' },
  { effect: 'You start with 5 less max health, but cutting cards at rest places is free.' },
];

/* ---------- today's sky (gochara, counted from the birth Moon) ---------- */

/* Houses from the birth Moon where each planet's transit is classically good (Phaladeepika's table). */
export const GOOD_FROM_MOON: Record<string, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 11],
  Ketu: [3, 6, 11],
};

/* How heavily a planet in a hard place weighs on the day: slow planets weigh most. */
export const PRESS: Record<string, number> = { Saturn: 9, Rahu: 8, Ketu: 7, Mars: 6, Jupiter: 5, Sun: 4, Venus: 3, Mercury: 2, Moon: 1 };

export const TRANSIT_LINE: Record<string, { good: string; hard: string }> = {
  Sun: { good: 'A good place for you: step forward and be seen.', hard: 'A hard place for you: pride trips easily, so let others go first.' },
  Moon: { good: 'A soft day: your mood is on your side.', hard: 'Feelings run high. Give yourself room.' },
  Mars: { good: 'Energy to finish hard things. Use it.', hard: 'A short fuse. Slow down before you act.' },
  Mercury: { good: 'A clear head for talks, plans and deals.', hard: 'Words get crossed easily. Read twice, send once.' },
  Jupiter: { good: 'Luck and good advice come more easily.', hard: 'Don\'t overpromise. Grow slowly.' },
  Venus: { good: 'Warmth with people and joy in small things.', hard: 'Easy to overspend on comfort. Choose what lasts.' },
  Saturn: { good: 'Patient work pays off now.', hard: 'A heavy stretch. Keep going, keep it simple.' },
  Rahu: { good: 'Bold new tries can work out.', hard: 'Restless wants. Ask if you really need it.' },
  Ketu: { good: 'Letting go comes easily. Clear out old things.', hard: 'You may feel far away. Stay close to what is real.' },
};

/* One gentle remedy (upaya) per planet. Free practices only: no gemstones, nothing to buy. */
export const REMEDY: Record<string, { mantra: string; act: string; practice: string }> = {
  Sun: { mantra: 'Om Suryaya Namah', act: 'Show respect to your father or an elder.', practice: 'Watch the sunrise, or offer it a little water.' },
  Moon: { mantra: 'Om Chandraya Namah', act: 'Call your mother, or someone who cares for you.', practice: 'Drink water slowly and rest your mind for a while.' },
  Mars: { mantra: 'Om Mangalaya Namah', act: 'Help a brother or a friend with something physical.', practice: 'Burn off the heat with a walk or a run, not with words.' },
  Mercury: { mantra: 'Om Budhaya Namah', act: 'Keep a small promise exactly as you made it.', practice: 'Write down what is in your head. Wear something green.' },
  Jupiter: { mantra: 'Om Gurave Namah', act: 'Give a little food to someone who needs it.', practice: 'Learn one thing from someone wiser, or teach one.' },
  Venus: { mantra: 'Om Shukraya Namah', act: 'Be gentle with someone you love.', practice: 'Make something beautiful, or tidy a space.' },
  Saturn: { mantra: 'Om Shanaye Namah', act: 'Help someone older, or someone who works hard for little.', practice: 'Finish one slow, honest job. Light a lamp at dusk.' },
  Rahu: { mantra: 'Om Rahave Namah', act: 'Give away something you don\'t need.', practice: 'Put your phone down for an hour.' },
  Ketu: { mantra: 'Om Ketave Namah', act: 'Feed a stray dog if you can.', practice: 'Sit quietly for a few minutes and let one old grudge go.' },
};

/* ---------- the houses as chapters of a life ---------- */

/* What each house rules, opening its chapter of the run. */
export const HOUSE_OPENING: { rules: string; text: string }[] = [
  { rules: 'the self', text: 'The first house is your own body and the self you show the world. Here you meet what you were born as.' },
  { rules: 'family and wealth', text: 'The second house holds what you keep: family, food, savings, and the words you speak.' },
  { rules: 'courage and effort', text: 'The third house is courage and effort: your own hands, short journeys, brothers and sisters.' },
  { rules: 'home and mother', text: 'The fourth house is home: your mother, the ground under you, the peace you return to.' },
  { rules: 'creation and joy', text: 'The fifth house is what you create: children, ideas, joy, and merit carried from before.' },
  { rules: 'struggle and service', text: 'The sixth house is struggle: enemies, illness, debts, and the daily work that wears them down.' },
  { rules: 'partners', text: 'The seventh house is the other: partners, marriage, and everyone who stands across from you.' },
  { rules: 'what is hidden', text: 'The eighth house is hidden: sudden change, secrets, inheritance, and what lies under the surface.' },
  { rules: 'the path and fortune', text: 'The ninth house is your path: teachers, faith, fortune, and long journeys.' },
  { rules: 'work in the world', text: 'The tenth house is your work in the world: what you do, and what you are known for.' },
  { rules: 'gains and friends', text: 'The eleventh house is gain: friends, income, and the hopes that come true.' },
  { rules: 'release', text: 'The twelfth house is release: loss, sleep, far lands, and letting go. Beyond it, the wheel turns.' },
];
