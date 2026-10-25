# Bhava: The Twelve Houses

An astrology roguelite for Android by 12th House Protocol. Your real birth chart is the map: twelve houses, one run, then a reading of your own placements. A small sibling of Samsara, built on the same Vedic engine and ink look.

## Run it

```
npm install
npm run dev          # open the address it prints, on your computer or phone (same Wi-Fi)
npm test             # engine checks
```

## Build for Android

Needs Android Studio (with the Android 16 / API 36 SDK).

```
npm run android      # builds the web app and copies it into android/
npx cap open android # opens Android Studio (or File > Open the android folder yourself)
```

The app id is `com.twelfthhouseprotocol.bhava`. It can never change once the app is on Google Play.

## Quick preview

```
npm run build:preview   # one self-contained page in preview/
```

## What is where

| Path | What it holds |
|---|---|
| `src/engine/` | The Samsara star engine, copied unchanged from sahannonis/samsara (commit b2791ab). Don't edit it here; copy a new version over on purpose. |
| `src/data/places.bin` | About 172,000 birthplaces with their time zones (gzipped, same list as Samsara). |
| `src/places.ts` | Place search, all offline, plus map coordinates for places not on the list. |
| `src/seed.ts` | A birth becomes a class and twelve houses: sign, element, planets, strength, house lord, and the random seed. |
| `src/chartSvg.ts` | The chart, drawn North Indian style. It is also the run map. |
| `src/content.ts` | Working names and draft rules: the nine planet enemies, the ground each element gives, rest-place gifts by house lord, the twelve daily Moon effects, the gochara table, transit lines and the nine remedies. |
| `src/today.ts` | Today's sky: the real planets now, counted from your birth Moon (gochara), with Chandrashtama, Sade Sati, the day's remedy and the Moon's phase. |
| `src/rng.ts` | Seeded randomness from the birth seed and run number. |
| `src/ambience.ts` | The twinkling gold starlight behind the pages. |
| `src/game/` | The fight rules with no screen: `cards.ts` (37 cards, class decks, statuses), `yogas.ts` (nine yogas formed by two planets' cards in one turn), `enemies.ts` (the nine planets, eight lesser spirits, conjunction bosses, the gate shade, scaling by house), `run.ts` (each house as a chapter of steps, walking a run, story outcomes and upgrades), `stories.ts` (the twelve story choices), `rewards.ts` (card picks and the stall), `combat.ts` (turns, breath, drawing, damage, block, burn, weak, exposed, might, charm, the four grounds). |
| `src/combatView.ts` | The fight screen: the hand, intents, lamps for breath, the first-fight guide, yoga banners, and the playback of hits, numbers, ink splats and shakes. |
| `src/haptics.ts` | Phone vibration, with an off switch. |
| `src/settings.ts` | Player settings kept on the phone (vibration, fight guide). |
| `src/runView.ts` | The run pages: house openings, card picks, story choices, the rest place (rest or meditate, the stall, cutting cards, the shrine, the lore stone), cleared houses, the end of a run. |
| `src/cardsView.ts` | Cards shown outside a fight, and the sheet for choosing one. |
| `src/runStore.ts` | The run in progress and the houses ever cleared, kept on the phone. |
| `src/main.ts` | The birth and map screens. |
| `capacitor.config.json` | App id and name for Android (JSON, so it works with any TypeScript or Node version). |
| `src/store.ts` | Saving on the phone only. |
| `tests/` | `engine.test.cjs` (a known chart, old Sri Lankan time), `rng.test.ts` (seeded randomness), `combat.test.ts` (fight rules, plus a bot that must win with every class on every ground), `run.test.ts` (house chapters for 200 made-up charts, and how far a bot gets with the starting deck), `day6.test.ts` (upgrades, card picks, stories) and `screens.py` (phone-sized screen checks with Playwright). |

## Rules

- Birth data stays on the device. No accounts, nothing sent anywhere.
- Readings are labelled "for entertainment and self-reflection".
- No new features once building starts; ideas go on the parked list in the spec.

## Build log

- **Day 1 (24 Oct 2026):** project shell (Vite, TypeScript, Capacitor 8, Android target API 36), the engine copied in, birth entry with offline place search and map coordinates, the chart and the twelve-house seed on screen, birth kept on the phone.
- **Day 2 (25 Oct 2026):** the chart is now the run map: ink hatching shows fights, bosses and the final gate, a dotted red line shows where you stand, and tapping a house shows its ground, its enemies or its rest-place gift. Today's Moon modifier and real Moon phase, seeded randomness, Latin-only fonts. Lamplight and twinkling gold starlight on the leaf, a slowly turning star wheel behind the title, the chart drawn in ink as it opens, planets that rise and glow in their own colours, a lit chosen house and walking red dots where you stand. Today's sky: a Birth chart / Today's sky switch on the map, transits counted from the birth Moon with good and hard places, Chandrashtama and Sade Sati notes, and one free remedy a day (mantra, a small act, a practice).
- **Day 3 (25 Oct 2026):** the combat core. Turn-based card fights for touch: a hand of 5, 3 breath shown as clay lamps, tap a card then tap again or tap the enemy, enemy intents that show the damage you will really take, block, burn, weak, exposed, might and charm, and the ground rules of each element. Each class starts with its signature card. Hits land with a short freeze, an ink splat, a shake, a rising number and a phone vibration. A practice fight on your 1st house's ground, with today's Moon effect, can be won or lost.
- **Day 4 (25 Oct 2026):** 37 cards across the nine planets, an 11-card starting deck and a trait for each class, nine yogas, and today's best-placed planet lending a card in every fight. A guide on the first fight. Vibration reworked to play at the phone's default strength, with an on/off switch and a test button on the map.
- **Day 5 (25 Oct 2026):** the nine planet enemies, two lesser spirits per element, conjunction bosses built from a house's planets, and the final gate (a shade of your lagna lord when the 12th is empty). Enemies grow by house number and by planet strength; today's pressing planet hits 1 harder. Each house is a chapter: an opening about what it rules, then its steps. A full run plays from the 1st house to the 12th, with health and prana carried between fights, saved after every step, and cleared houses kept and shown on the chart.
- **Day 6 (25 Oct 2026):** an upgrade for every card; after each fight, pick one of three cards drawn from that house's planets, your class and the sky, or take prana. Twelve story choices, one per house, that move karma, health, prana and cards. The full rest place: rest or meditate (upgrade), the house lord's gift, the keeper's stall, cutting cards, the shrine's remedy that stops the pressing planet's enemies hitting harder, and a lore stone. Today's Moon effects outside fights now apply. Enemies blink and breathe. 'Your chart in detail' shows every position to the arc-minute, with nakshatra and pada, and how it was worked out.
- **Day 6b (25 Oct 2026), after the first full test run:** card names always fit; yogas stay on screen for 3 seconds (tap to close), show as chips for the rest of the turn, and are kept in a Book of Yogas on the map. Cards have 4 levels shown as dots; meditating shows each card at its next level, and rest and meditate are tracked separately (the Sun's rest places allow both). The lore stone is a proper button. Only newly drawn cards fly in, out of a draw pile, and the hand flies into a discard pile at the end of the turn. Sounds for everything, made in code (blade swish, hits, wood-knock blocks, healing bells, burn crackle, a singing bowl for yogas, a gong for your turn and a drum for theirs), with a switch on the map. Harder and longer runs: every house now has a fight, lesser spirits come in pairs from the 5th house, planets, bosses and the gate become enraged below half health, and enemy health grows faster. A whole-run simulator (`npx tsx tests/sim.ts`) checks balance: tapping whatever is playable reaches about house 7 and wins about 1 run in 20; careful play reaches about house 9 and wins about 1 first run in 6.
