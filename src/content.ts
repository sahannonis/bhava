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

/* Today's Moon, counted from your lagna: one effect for the day. */
export const MOON_DAY: { title: string; effect: string }[] = [
  { title: 'Moon in your 1st', effect: 'You start the run with 5 more max health.' },
  { title: 'Moon in your 2nd', effect: 'Fights give 10% more prana.' },
  { title: 'Moon in your 3rd', effect: 'The first card you play in each fight costs no breath.' },
  { title: 'Moon in your 4th', effect: 'Rest places heal half as much again.' },
  { title: 'Moon in your 5th', effect: 'After each fight, pick from one more card.' },
  { title: 'Moon in your 6th', effect: 'Enemies start each fight with 10% less health.' },
  { title: 'Moon in your 7th', effect: 'Bosses have 10% more health but give half as much karma again.' },
  { title: 'Moon in your 8th', effect: 'Karma earned is up a quarter, but enemies hit 1 harder.' },
  { title: 'Moon in your 9th', effect: 'You start the run with one card already upgraded.' },
  { title: 'Moon in your 10th', effect: 'Your attacks deal 1 more damage.' },
  { title: 'Moon in your 11th', effect: 'All prana you gain is up a quarter.' },
  { title: 'Moon in your 12th', effect: 'You start with 5 less max health, but cutting cards at rest places is free.' },
];
