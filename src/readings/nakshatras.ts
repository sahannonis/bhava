/* The 27 nakshatras, the lunar mansions. The Moon's nakshatra at birth (janma nakshatra) is one of the
   most personal facts in a Vedic chart: it sets the dasha sequence and colours the whole emotional life.
   For entertainment and self-reflection. */

export type Nakshatra = { name: string; deity: string; symbol: string; key: string; text: string };

export const NAKSHATRAS: Nakshatra[] = [
  { name: 'Ashwini', deity: 'the Ashwini twins, healers of the gods', symbol: "a horse's head", key: 'the star of quick starts and healing',
    text: 'You were born under the horse-headed star of the divine healers. You move before others have decided, you recover faster than anyone expects, and there is something in you that wants to rescue. The danger is rushing; the gift is arriving just in time.' },
  { name: 'Bharani', deity: 'Yama, lord of death and duty', symbol: 'a womb', key: 'the star of carrying and bearing',
    text: 'You were born under the star of the womb, ruled by Yama, who keeps the law of endings. You carry more than you show: responsibilities, desires, other people\'s weight. You feel life at its extremes, and you are stronger at the threshold than most people ever have to be.' },
  { name: 'Krittika', deity: 'Agni, the sacred fire', symbol: 'a blade or flame', key: 'the star of the cutting flame',
    text: 'You were born under the star of Agni\'s fire, the blade that cuts and cooks. You see what is false and you say it. You can be sharp, but you burn away what does not serve, and people come to you when they need the truth.' },
  { name: 'Rohini', deity: 'Brahma, the creator', symbol: 'a chariot or ox cart', key: 'the star of beauty and growth',
    text: 'You were born under Rohini, the Moon\'s favourite star. Things grow around you: gardens, money, people, love. You have a gift for beauty and comfort, and a pull toward the good life that you will have to choose wisely with.' },
  { name: 'Mrigashira', deity: 'Soma, the Moon\'s nectar', symbol: "a deer's head", key: 'the star of the seeker',
    text: 'You were born under the deer\'s head, the star of the search. You are curious, gentle and restless, always following a scent of something more. The search itself is your gift, as long as you let yourself arrive sometimes.' },
  { name: 'Ardra', deity: 'Rudra, the storm', symbol: 'a teardrop', key: 'the star of the storm that clears',
    text: 'You were born under Ardra, the teardrop of the storm god. You feel things fiercely, and your life has storms that break things open. What comes after each one is clearer air: you grow by being shaken.' },
  { name: 'Punarvasu', deity: 'Aditi, mother of the gods', symbol: 'a quiver of arrows', key: 'the star of return and renewal',
    text: 'You were born under the star of return. However far you wander or however much you lose, you come back, and you come back whole. You are generous, hopeful and at home almost anywhere.' },
  { name: 'Pushya', deity: 'Brihaspati, teacher of the gods', symbol: "a cow's udder", key: 'the star of nourishing',
    text: 'You were born under Pushya, held to be the kindest star of all. You nourish people: with food, advice, protection or simply your steadiness. Your life ripens slowly and well, and others feel safer near you.' },
  { name: 'Ashlesha', deity: 'the Nagas, serpent spirits', symbol: 'a coiled serpent', key: 'the star of the coiled serpent',
    text: 'You were born under the coiled serpent. You read people quickly and deeply, often before they know themselves. That insight can bind or heal; your power grows when you use it to free others rather than hold them.' },
  { name: 'Magha', deity: 'the Pitris, the ancestors', symbol: 'a royal throne', key: 'the star of the ancestors\' throne',
    text: 'You were born under the throne of the ancestors. You carry your family line, its pride and its unfinished business. You have a natural dignity, and you do best when you honour where you came from without being ruled by it.' },
  { name: 'Purva Phalguni', deity: 'Bhaga, god of delight', symbol: 'the front legs of a bed', key: 'the star of rest and pleasure',
    text: 'You were born under the star of the marriage bed, ruled by the god of delight. You know how to enjoy life, love and company, and you make others feel at ease. Rest is not laziness for you; it is how you create.' },
  { name: 'Uttara Phalguni', deity: 'Aryaman, god of contracts and friendship', symbol: 'the back legs of a bed', key: 'the star of loyal bonds',
    text: 'You were born under the star of promises kept. You are loyal, helpful and steady in your friendships and partnerships, and people trust your word. Your life is built through the bonds you honour.' },
  { name: 'Hasta', deity: 'Savitar, the sun of skill', symbol: 'an open hand', key: 'the star of the skilful hand',
    text: 'You were born under the star of the hand. You are clever with your hands and your mind, quick to fix, make and solve. Luck comes to you through skill, and humour is one of your tools.' },
  { name: 'Chitra', deity: 'Vishvakarma, the divine architect', symbol: 'a shining jewel', key: 'the star of the bright jewel',
    text: 'You were born under Chitra, the jewel of the architect. You want to make something beautiful and lasting, including yourself. You have an eye for design and a love of being seen at your best.' },
  { name: 'Swati', deity: 'Vayu, the wind', symbol: 'a young shoot in the wind', key: 'the star of the independent wind',
    text: 'You were born under Swati, the shoot that bends in the wind and does not break. You need freedom above almost everything, and you find your own way through. Flexibility is your strength, and patience your quiet power.' },
  { name: 'Vishakha', deity: 'Indra and Agni together', symbol: 'a triumphal arch', key: 'the star of the single goal',
    text: 'You were born under the star of the gateway, with two gods of power behind it. When you fix on a goal you do not let go, and you usually get there. Learn to enjoy the road, not only the arch at the end of it.' },
  { name: 'Anuradha', deity: 'Mitra, god of friendship', symbol: 'a lotus', key: 'the star of devoted friendship',
    text: 'You were born under the lotus, the star of friendship. You bloom in difficult places, and you are fiercely loyal to the people you love. You can work with anyone, and your friendships carry you far.' },
  { name: 'Jyeshtha', deity: 'Indra, king of the gods', symbol: 'a protective earring', key: 'the star of the eldest',
    text: 'You were born under the star of the eldest. You take responsibility early, protect others and carry authority, sometimes before you want it. Your challenge is to lead without having to hold everything alone.' },
  { name: 'Mula', deity: 'Nirriti, goddess of dissolution', symbol: 'tied roots', key: 'the star of the root',
    text: 'You were born under Mula, the root. You want to get to the bottom of things, and life sometimes pulls up what you have planted so you can see what it rests on. You are a seeker of truth, and you rebuild stronger from the ground.' },
  { name: 'Purva Ashadha', deity: 'Apas, the waters', symbol: 'a winnowing fan', key: 'the star of the undefeated',
    text: 'You were born under the star of the invincible waters. You are hard to beat and harder to discourage, and your enthusiasm wins people over. Your words have the power to cleanse and to persuade.' },
  { name: 'Uttara Ashadha', deity: 'the Vishvadevas, the universal gods', symbol: "an elephant's tusk", key: 'the star of the final victory',
    text: 'You were born under the star of the victory that lasts. You win slowly and permanently, by principle rather than force. People come to rely on you, and what you build carries your name long after.' },
  { name: 'Shravana', deity: 'Vishnu, the preserver', symbol: 'an ear', key: 'the star of listening',
    text: 'You were born under the star of the ear. You learn by listening, and people tell you things they tell no one else. Your gift is to hear what is really being said, and to carry knowledge forward.' },
  { name: 'Dhanishta', deity: 'the Vasus, gods of abundance', symbol: 'a drum', key: 'the star of the rhythm of wealth',
    text: 'You were born under the drum. You have rhythm in the deepest sense: music, timing, and the knack of being in the right place when wealth moves. You shine in groups and come into your own with age.' },
  { name: 'Shatabhisha', deity: 'Varuna, lord of the cosmic waters', symbol: 'an empty circle', key: 'the star of a hundred healers',
    text: 'You were born under the star of a hundred healers. You are private, independent and drawn to mysteries, medicine and hidden truths. You need solitude to recharge, and you can heal what others have given up on.' },
  { name: 'Purva Bhadrapada', deity: 'Aja Ekapada, the one-footed goat of fire', symbol: 'the front of a funeral cot', key: 'the star of the burning sacrifice',
    text: 'You were born under a fierce, spiritual star. You feel the extremes of life and you are capable of great sacrifice for what you believe. You transform through intensity, and you are not afraid of the dark.' },
  { name: 'Uttara Bhadrapada', deity: 'Ahir Budhnya, the serpent of the deep', symbol: 'the back of a funeral cot', key: 'the star of the deep waters',
    text: 'You were born under the star of the serpent in the deep. You are calm on the surface and deep below it, wise beyond your years and slow to anger. You bring stillness to people who are lost in their own storms.' },
  { name: 'Revati', deity: 'Pushan, the shepherd of journeys', symbol: 'a fish or a drum', key: 'the star of safe passage',
    text: 'You were born under Revati, the last star, ruled by the shepherd who guides travellers home. You are gentle, protective and imaginative, and you help others make their crossings safely. Your life ends cycles, and begins new ones.' },
];

export const NAK_SPAN = 360 / 27;
export const nakOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / NAK_SPAN);
export const padaOf = (lon: number) => Math.floor(((((lon % 360) + 360) % 360) % NAK_SPAN) / (NAK_SPAN / 4)) + 1;
/* The nakshatra's ruling planet, which starts the dasha sequence for a Moon born there. */
export const NAK_LORD = (i: number) => ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'][i % 9];
