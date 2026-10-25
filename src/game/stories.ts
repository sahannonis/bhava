/* One story choice per house, themed on what the house rules. Each answer moves karma,
   and may cost or give health, prana or a card. Karma is counted on Day 7. Drafts for Sahan to rewrite. */

export type Outcome = {
  karma: number;
  hp?: number;        // + heals, - hurts (never below 1)
  maxHp?: number;
  prana?: number;     // - spends; you can't go below 0
  addCard?: string;
  removeCard?: 'strike' | 'guard';
  upgrade?: 'random';
  text: string;       // what happens, shown after the choice
};
export type Story = { house: number; scene: string; options: { label: string; outcome: Outcome }[] };

export const STORIES: Story[] = [
  { house: 1, scene: 'A still pool shows your face, but not as you are: as you wish to be seen.', options: [
    { label: 'Look until you see yourself plainly', outcome: { karma: 2, hp: 6, text: 'The wish fades and your own face looks back. You feel lighter.' } },
    { label: 'Admire the reflection', outcome: { karma: -1, addCard: 'focus', text: 'You leave taller than you came, and a little less honest.' } },
  ] },
  { house: 2, scene: 'A beggar at the gate asks for some of your prana. His hands shake.', options: [
    { label: 'Give him 15 prana', outcome: { karma: 3, prana: -15, text: 'He bows. The coins are lighter in his hands than in yours.' } },
    { label: 'Keep it for the road', outcome: { karma: -2, text: 'You walk on. The gate closes softly behind you.' } },
  ] },
  { house: 3, scene: "A rope bridge sways over a gorge. On the far side, your brother's voice calls your name.", options: [
    { label: 'Cross now', outcome: { karma: 1, hp: -6, addCard: 'twinSpears', text: 'The ropes burn your hands, but you reach him. He presses his old spears into yours.' } },
    { label: 'Take the long way round', outcome: { karma: 0, text: 'No harm comes to you. By the time you arrive, he has gone ahead.' } },
  ] },
  { house: 4, scene: 'An old woman offers you rice from her own small pot.', options: [
    { label: 'Eat, and thank her', outcome: { karma: 1, hp: 12, text: 'It tastes like a home you almost remember.' } },
    { label: 'Leave the food for her', outcome: { karma: 3, text: 'She smiles as if you had eaten. Perhaps, in a way, you have.' } },
  ] },
  { house: 5, scene: "A child's clay toy lies broken in the road. The child is nowhere to be seen.", options: [
    { label: 'Mend it and leave it where it was', outcome: { karma: 2, upgrade: 'random', text: 'Your hands remember how to make things. One of your cards grows stronger.' } },
    { label: 'Step past', outcome: { karma: -1, prana: 10, text: 'You find a few coins further on. They don\'t feel like yours.' } },
  ] },
  { house: 6, scene: 'Someone who once wronged you lies hurt by the road.', options: [
    { label: 'Help them up', outcome: { karma: 3, hp: -5, text: 'It costs you strength, and something heavier than strength leaves you.' } },
    { label: 'Take their blade and go', outcome: { karma: -2, addCard: 'riposte', text: 'The blade fits your hand well. The silence behind you does not.' } },
  ] },
  { house: 7, scene: 'Two travellers ask you to settle their quarrel. One of them offers to pay.', options: [
    { label: 'Judge fairly', outcome: { karma: 2, prana: -10, text: 'Both leave unhappy, which is how you know it was fair. You buy them tea.' } },
    { label: 'Side with the one who pays', outcome: { karma: -2, prana: 20, text: 'The coins are good. The other traveller\'s look stays with you.' } },
  ] },
  { house: 8, scene: 'A sealed box lies half buried, warm to the touch. Something inside is breathing.', options: [
    { label: 'Open it', outcome: { karma: 0, hp: -8, addCard: 'eclipse', text: 'Smoke pours out and into you. You carry something of it now.' } },
    { label: 'Bury it deeper', outcome: { karma: 1, text: 'Some things are kept hidden for a reason. You let this one rest.' } },
  ] },
  { house: 9, scene: 'A teacher offers you one lesson, but asks you to set down something you carry.', options: [
    { label: 'Set down a Strike', outcome: { karma: 2, removeCard: 'strike', text: 'Your hands are freer. The lesson stays.' } },
    { label: 'Keep everything', outcome: { karma: 0, text: 'The teacher nods and says nothing. The lesson goes untaught.' } },
  ] },
  { house: 10, scene: 'Workers building a temple ask for one more pair of hands.', options: [
    { label: 'Work with them until dusk', outcome: { karma: 2, hp: -6, upgrade: 'random', text: 'Your back aches. Your craft is sharper.' } },
    { label: 'Walk on to your own work', outcome: { karma: 0, text: 'The temple will be finished without you.' } },
  ] },
  { house: 11, scene: 'Old friends share a meal and their savings, and ask you to stay the night.', options: [
    { label: 'Stay, and let them give', outcome: { karma: 0, hp: 12, prana: 15, text: 'You sleep well for the first time in a long while.' } },
    { label: 'Share what you have too', outcome: { karma: 3, prana: -10, hp: 6, text: 'The table is fuller for it, and so are you.' } },
  ] },
  { house: 12, scene: 'At the river, a ferryman asks what you will leave behind before you cross.', options: [
    { label: 'Leave your anger', outcome: { karma: 3, maxHp: 5, text: 'The boat rides higher in the water. So do you.' } },
    { label: 'Leave nothing', outcome: { karma: -1, text: 'You carry it all across. The ferryman says nothing.' } },
  ] },
];
