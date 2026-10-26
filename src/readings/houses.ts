/* What each house means, for the Book of the Sky and the opening of each house reading,
   and the house lords: where each house's ruler sits says where that part of life is lived out.
   Drafts for Sahan to edit. For entertainment and self-reflection. */

export const HOUSE_NAME = ['Tanu', 'Dhana', 'Sahaja', 'Sukha', 'Putra', 'Ari', 'Yuvati', 'Randhra', 'Dharma', 'Karma', 'Labha', 'Vyaya'];

export const HOUSE_MEANING: { short: string; text: string }[] = [
  { short: 'yourself', text: 'The 1st house is you: your body, your health, your nature and the way you meet the world. Its sign is your lagna, the sign that was rising in the east when you were born, and every other house is counted from it.' },
  { short: 'family, wealth and speech', text: 'The 2nd house holds what you keep: money and things of value, your family and the food you grew up on, and your voice, the way you speak and what you say.' },
  { short: 'courage and siblings', text: 'The 3rd house is your own effort: courage, drive, skill with your hands and words, short journeys, and your younger brothers and sisters. It grows stronger the more you use it.' },
  { short: 'home and mother', text: 'The 4th house is where you rest: home, mother, land and vehicles, your schooling, and the peace of your own heart. It sits at the bottom of the chart, like roots.' },
  { short: 'children and creativity', text: 'The 5th house is what you make and love freely: children, creativity, romance, learning, play, and the good you carry from past lives (purva punya). It is one of the luckiest houses.' },
  { short: 'struggle and service', text: 'The 6th house is the daily fight: illness, debt, rivals and hard work, and also service and the skill to beat what stands against you. Hard planets often do well here.' },
  { short: 'partnership and marriage', text: 'The 7th house faces the 1st: it is the other person. Marriage and partners, business deals, open enemies, and how you show up when someone else is in the room.' },
  { short: 'change and hidden things', text: 'The 8th house is what lies under the surface: sudden change, crisis and rebirth, long life, inheritance and shared money, secrets, research and the occult.' },
  { short: 'luck, faith and teachers', text: 'The 9th house is dharma: your beliefs, your teachers and your father, long journeys, higher learning and plain good fortune. It is the most blessed of the houses.' },
  { short: 'work and standing', text: 'The 10th house sits at the top of the chart: your career, your actions in the world, your reputation and what you are known for. It is the house of karma in the sense of deeds.' },
  { short: 'gains and friends', text: 'The 11th house is what comes in: income and gains, wishes fulfilled, friends, networks and elder siblings. Almost every planet does well here.' },
  { short: 'release and letting go', text: 'The 12th house is what goes out: loss and expense, sleep, solitude, foreign lands, retreat and spiritual release (moksha). It ends the circle, and makes room for the next.' },
];

/* The lord of a house carries that house's matters to wherever it sits.
   A reading is built from where it comes from, where it goes, and what kind of house it lands in. */
export const LORD_FROM: string[] = [
  'Your sense of self, your health and your direction in life',
  'Your money, your family and the way you speak',
  'Your courage, your effort and your brothers and sisters',
  'Your home, your mother and your peace of mind',
  'Your creativity, your children and your heart\'s joys',
  'Your struggles, your daily work and the way you deal with opposition',
  'Your partnerships, and the people you choose to walk with',
  'The hidden, changing side of your life',
  'Your luck, your faith and your teachers',
  'Your work and your standing in the world',
  'Your gains, your friends and your hopes',
  'What you let go of, where you rest, and your spiritual life',
];

export const LORD_TO: string[] = [
  'are bound up with who you are: they shape your body and character, and you meet them directly in your own life.',
  'flow into money, family and speech: they show up in what you earn, keep and say.',
  'are lived through your own effort, courage and communication: you have to reach for them yourself.',
  'settle into home and the inner life: they show up in your house, your mother and your need for peace.',
  'are joined to creativity, learning and children: they bring a sense of play and of things that come easily from the past.',
  'pass through struggle and service: they ask for work and competition, and reward you for not giving up.',
  'are lived through other people: partners, marriage and open dealings bring them to you.',
  'go underground and change: they arrive through sudden turns, hidden matters or other people\'s resources.',
  'are blessed by dharma: teachers, faith, long journeys and good fortune carry them.',
  'come out in your work and public life: they are seen, and they shape what you are known for.',
  'turn into gains: they bring income, friends and wishes fulfilled.',
  'drift toward release: they ask for letting go, may come through foreign places or retreat, and can cost before they give.',
];

/* What kind of house the lord lands in, counted the way Jyotisha groups the houses. */
export function placementNote(to: number): string {
  if (to === 1 || to === 5 || to === 9) return 'A trikona, a house of fortune: this is a happy placement.';
  if (to === 4 || to === 7 || to === 10) return 'A kendra, a pillar of the chart: this placement has strength and shows in your life.';
  if (to === 6 || to === 8 || to === 12) return 'A dusthana, a house of difficulty: this part of life asks more of you, and gives depth in return.';
  if (to === 3 || to === 11) return 'An upachaya, a house that grows with time: it gets better the older and more experienced you are.';
  return 'A house of wealth: this placement ties the matter to what you hold and keep.';
}

export function lordLine(from: number, to: number): string {
  if (from === to) return `${LORD_FROM[from - 1]} are ruled by a planet sitting in its own house. That makes this house strong and self-reliant: it looks after itself.`;
  return `${LORD_FROM[from - 1]} ${LORD_TO[to - 1]}`;
}

export const STRENGTH_LINE: Record<string, string> = {
  exalted: 'It is exalted here, at its very best, so what it gives comes strongly.',
  'own sign': 'It sits in its own sign, at home and comfortable, so what it gives comes steadily.',
  debilitated: 'It is debilitated here, at its weakest, so what it gives comes with effort; this is also how people grow strong in that very place.',
  neutral: '',
};
export const RETRO_LINE = 'It was retrograde when you were born: its lessons turn inward, and you may return to them more than once.';
