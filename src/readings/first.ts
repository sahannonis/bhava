/* The first reading, free, right after the chart is cast: the lagna (how you meet the world)
   and the Moon sign (how you feel inside). Drafts for Sahan to edit in his own voice.
   Index 0 = Aries ... 11 = Pisces. For entertainment and self-reflection. */

export const LAGNA_READ: string[] = [
  // Aries
  'You meet the world head first. You start things before others have finished talking about them, and you would rather try and fail than wait. Patience is the lesson that keeps coming back to you: the fire that lights quickly needs feeding to last.',
  // Taurus
  'You meet the world slowly and surely. You trust what you can touch, build things meant to last, and do not like to be rushed. Comfort matters to you, and so does loyalty; your life grows the way a tree does, a ring at a time.',
  // Gemini
  'You meet the world with questions. Your mind moves fast, you talk your way into rooms and out of trouble, and you can see two sides of most things. Your gift is connection; your lesson is to finish one thread before picking up the next.',
  // Cancer
  'You meet the world with feeling first. You notice moods others miss, and you protect the people you love like a shell around something soft. Home is where your strength comes from, and you carry your past closer than most.',
  // Leo
  'You meet the world as if you were meant to be seen. You have warmth and pride in equal measure, and people tend to look to you when something needs leading. Your lesson is to shine without needing the applause.',
  // Virgo
  'You meet the world with a careful eye. You see what is out of place, you want things done properly, and you are happiest when you are useful. Be as gentle with yourself as you are exact with your work.',
  // Libra
  'You meet the world looking for balance. You are fair, easy to be around, and you feel a room\'s harmony like the weather. Your strength grows through other people; your lesson is to choose, even when every side has a point.',
  // Scorpio
  'You meet the world with depth. You feel more than you show, you notice what is hidden, and once you commit you do not let go easily. Your life has turning points that change you completely, and you come back stronger each time.',
  // Sagittarius
  'You meet the world looking past the horizon. You want meaning, freedom and the truth, and you say what you think. Teachers, travel and big ideas shape you; your lesson is to keep your aim when the road gets dull.',
  // Capricorn
  'You meet the world as someone with work to do. You are patient, practical and quietly ambitious, and you often feel older than your years when young and younger as you age. What you build slowly, you keep.',
  // Aquarius
  'You meet the world a little apart from it. You think for yourself, care about people in general more easily than in the close and particular, and you are drawn to what is new. Your lesson is to let people in, not just ideas.',
  // Pisces
  'You meet the world with soft edges. You are imaginative, kind and easily moved, and you can sense what others feel without being told. Your gift is compassion; your lesson is to keep your own shape among other people\'s waters.',
];

export const MOON_READ: string[] = [
  // Aries
  'Inside, you feel quickly and fully. Anger and enthusiasm both rise fast and pass fast. You are at peace when you are moving, and restless when you are made to wait.',
  // Taurus
  'Inside, you are steady. The Moon is exalted here: your feelings are calm, loyal and slow to change. You find peace in good food, nature, music and the people who stay.',
  // Gemini
  'Inside, your feelings want words. You process what you feel by talking or writing it out, and a busy mind can keep you awake. You are soothed by conversation and new things to learn.',
  // Cancer
  'Inside, you feel deeply. The Moon is at home here: your moods follow the tides, and your memory for feelings is long. Being cared for, and caring for others, is what fills you up.',
  // Leo
  'Inside, you want to be warm and to be warmly seen. You feel proud, generous and hurt when ignored. You are at peace when you feel appreciated and free to create.',
  // Virgo
  'Inside, you feel through thinking. You worry when things are untidy, inside or out, and you calm yourself by sorting, fixing and helping. Your care is shown in small, practical acts.',
  // Libra
  'Inside, you need harmony. Quarrels unsettle you more than they show, and beauty steadies you. You feel most yourself in good company and in fair, gentle surroundings.',
  // Scorpio
  'Inside, you feel intensely and keep much of it private. The Moon is debilitated here, which makes feelings run deep and sometimes heavy. You heal by letting go, and you are braver with pain than most.',
  // Sagittarius
  'Inside, you need hope and room to roam. You feel lifted by faith, learning and open roads, and trapped by small, closed rooms. You recover from sadness by finding the meaning in it.',
  // Capricorn
  'Inside, you are reserved. You hold your feelings in until the work is done, and you may find rest hard to allow yourself. You feel safe when your life has structure and you know you are doing your duty.',
  // Aquarius
  'Inside, you are calm and a little detached. You feel for people and causes, but need your own space to breathe. You are at peace when you are free to be different.',
  // Pisces
  'Inside, you are open and dreamy. You absorb the moods around you and need quiet to rinse them out. Music, water, prayer and imagination are where your feelings rest.',
];

/* When the birth time is unknown, the houses are counted from the Moon instead of the lagna. */
export const NO_TIME_NOTE = 'Without a birth time the rising sign cannot be known, so this reading begins from your Moon, as Jyotisha does when the time is lost (Chandra lagna). Add your birth time if you find it, and the reading will grow.';
