# Bhava: The Twelve Houses

An astrology roguelite for Android by Starward. Your real birth chart is the map: twelve houses, one run, then a reading of your own placements. A small sibling of Samsara, built on the same Vedic engine and ink look.

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

The app id is `com.starward.bhava`. It can never change once the app is on Google Play.

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

## Adding the painted art

1. Save each finished image from the image tool into `art-src/`, named exactly as in the spec (`class-jupiter-f.png`, `class-jupiter-m.png`, `enemy-rahu.png`, `spirit-ember-imp.png`, `ground-water.png`, `place-hub.png`, `card-back.png` ...).
2. Run `npm run art`. It lifts the plain parchment out of each picture so the figure sits on the game's own leaf, shrinks it, and writes a small `.webp` into `src/art/`.
3. Build as usual (`npm run android`). Anything not there yet keeps the ink drawn in code, so images can arrive a few at a time.

The originals in `art-src/` are not committed (they are large); the `.webp` files in `src/art/` are.

## Build log

- **Day 1 (24 Oct 2026):** project shell (Vite, TypeScript, Capacitor 8, Android target API 36), the engine copied in, birth entry with offline place search and map coordinates, the chart and the twelve-house seed on screen, birth kept on the phone.
- **Day 2 (25 Oct 2026):** the chart is now the run map: ink hatching shows fights, bosses and the final gate, a dotted red line shows where you stand, and tapping a house shows its ground, its enemies or its rest-place gift. Today's Moon modifier and real Moon phase, seeded randomness, Latin-only fonts. Lamplight and twinkling gold starlight on the leaf, a slowly turning star wheel behind the title, the chart drawn in ink as it opens, planets that rise and glow in their own colours, a lit chosen house and walking red dots where you stand. Today's sky: a Birth chart / Today's sky switch on the map, transits counted from the birth Moon with good and hard places, Chandrashtama and Sade Sati notes, and one free remedy a day (mantra, a small act, a practice).
- **Day 3 (25 Oct 2026):** the combat core. Turn-based card fights for touch: a hand of 5, 3 breath shown as clay lamps, tap a card then tap again or tap the enemy, enemy intents that show the damage you will really take, block, burn, weak, exposed, might and charm, and the ground rules of each element. Each class starts with its signature card. Hits land with a short freeze, an ink splat, a shake, a rising number and a phone vibration. A practice fight on your 1st house's ground, with today's Moon effect, can be won or lost.
- **Day 4 (25 Oct 2026):** 37 cards across the nine planets, an 11-card starting deck and a trait for each class, nine yogas, and today's best-placed planet lending a card in every fight. A guide on the first fight. Vibration reworked to play at the phone's default strength, with an on/off switch and a test button on the map.
- **Day 5 (25 Oct 2026):** the nine planet enemies, two lesser spirits per element, conjunction bosses built from a house's planets, and the final gate (a shade of your lagna lord when the 12th is empty). Enemies grow by house number and by planet strength; today's pressing planet hits 1 harder. Each house is a chapter: an opening about what it rules, then its steps. A full run plays from the 1st house to the 12th, with health and prana carried between fights, saved after every step, and cleared houses kept and shown on the chart.
- **Day 6 (25 Oct 2026):** an upgrade for every card; after each fight, pick one of three cards drawn from that house's planets, your class and the sky, or take prana. Twelve story choices, one per house, that move karma, health, prana and cards. The full rest place: rest or meditate (upgrade), the house lord's gift, the keeper's stall, cutting cards, the shrine's remedy that stops the pressing planet's enemies hitting harder, and a lore stone. Today's Moon effects outside fights now apply. Enemies blink and breathe. 'Your chart in detail' shows every position to the arc-minute, with nakshatra and pada, and how it was worked out.
- **Day 6b (25 Oct 2026), after the first full test run:** card names always fit; yogas stay on screen for 3 seconds (tap to close), show as chips for the rest of the turn, and are kept in a Book of Yogas on the map. Cards have 4 levels shown as dots; meditating shows each card at its next level, and rest and meditate are tracked separately (the Sun's rest places allow both). The lore stone is a proper button. Only newly drawn cards fly in, out of a draw pile, and the hand flies into a discard pile at the end of the turn. Sounds for everything, made in code (blade swish, hits, wood-knock blocks, healing bells, burn crackle, a singing bowl for yogas, a gong for your turn and a drum for theirs), with a switch on the map. Harder and longer runs: every house now has a fight, lesser spirits come in pairs from the 5th house, planets, bosses and the gate become enraged below half health, and enemy health grows faster. A whole-run simulator (`npx tsx tests/sim.ts`) checks balance: tapping whatever is playable reaches about house 7 and wins about 1 run in 20; careful play reaches about house 9 and wins about 1 first run in 6.
- **Day 7 (25 Oct 2026):** karma is counted at the end of every run (houses cleared, your choices, a win bonus; falling keeps half) and spent in the hub on six lasting gifts. Winning opens the next of 12 lives, each adding one rule and 10% more karma. The daily sky trial: today's pressing planet and a spirit of the day, on the ground of today's Moon sign, once a day, with a practice streak that halves rather than resets on missed days. An opt-in morning reminder with the day's sky, scheduled on the phone a week ahead. The keeper also sharpens a card for prana, sparing a foe gives karma, and each planet's cards have their own sound.
- **Day 8 (26 Oct 2026):** the readings. A new chart opens with its first reading (lagna and Moon). Clearing a house opens its reading right there: what the house means, every planet in it (with exaltation, debilitation and retrograde notes) and where its lord sits, read the Parashari way (trikona, kendra, dusthana, upachaya). Houses 1–4 read in full for free; 5–12 show their opening lines and fade into the Full reading (free in the test build until Day 10). Every reading is kept in the Journal. The Book of the Sky replaces the Book of Yogas: 42 pages on the planets, houses, signs and yogas, each opening the first time you meet it in play, with what it means and where it sits in your own chart, including whether you were born with each yoga. About 330 texts, drafted for Sahan to edit in his own voice (src/readings/).
- **Day 9 (26 Oct 2026):** readings made personal in time. House readings now add each planet's nakshatra, the sign's character, the planets that look at the house (Parashari aspects), when the house speaks loudest (its lord's and planets' dasha periods and sub-periods, with real months, years and ages), the age each planet matures, which planets are crossing it today, and a closing thread weighed from the whole house. The first reading adds the birth star (janma nakshatra and pada), the chart's ruler and the dasha chapter you are in now. New: the whole-chart reading (all 12 houses cleared), the dasha timeline of a whole life with every sub-period, a daily line from today's Moon and its nakshatra (also in the morning reminder), and compatibility by the 36-point Ashtakoota match, read without gender, with up to 4 people kept on the phone. Opening the app now goes straight to the map; an unread first reading shows as a card.
- **Day 10 (26 Oct 2026):** porondam, the Sri Lankan match: the ten core points (Nakath, Gana, Mahendra, Stree Deergha, Yoni, Rashi, Rashyadhipathi, Vashya, Rajju, Vedha) counted from the bride's star, with Rajju and Yoni marked essential and Kuja dosha checked from the lagna and the Moon; Sri Lankan players see it first, with the 36-point match one tap away. The real Full reading purchase through Google Play (one-time product `full_reading`, via @capgo/native-purchases): a sheet that explains what it holds with the local price, Buy and Restore, a check against Google Play every time the app opens (so refunds and reinstalls are handled), and a free unlock only in the browser preview.
- **Play setup (27 Oct 2026):** app id changed to `com.starward.bhava` before the first upload; a privacy policy page in `docs/privacy.html` (served by GitHub Pages); the launcher icon, round icon, adaptive icon and splash screens replaced with the lamp-in-the-chart mark on parchment; the fight screen tightened for short phones (about 640 px tall) so the foe, the ground line and the hand never overlap.
- **1.0.1 (27 Oct 2026):** the phone's back button steps back through the game (closes a sheet, leaves a reading, returns to the chart; twice to leave a fight) instead of closing the app, and sends the app to the background from the chart. The purchase sheet now shows Google Play's own reason when a purchase fails.
- **1.0.3 (28 Oct 2026):** never more than two houses in a row without rest: when a chart crowds planets into house after house, the third such house ends with a wayside rest (before the gate in the 12th), shown on the map. Deck viewer on the chart, every run page and the fight's draw and discard piles. Portrait lock and a parchment launch screen.
- **1.0.4 (28 Oct 2026):** a private code for Google Play's reviewers ("I have a code" in the map's settings) that opens the Full reading on their device; only its hash is in the app.
- **Day 11, 1.0.5 (28 Oct 2026):** an animated opening after the launch screen (the leaf dims, a lamp is struck, the chart draws itself in gold with a star in each house, the name rises; a tap skips it, and it is quicker after the first time). Colour in the fight: every planet's cards carry its colour, played cards leave a trail of light and land in a burst of sparks and a ring, hits flash the foe, block, healing and statuses each have their own light, a fallen foe lifts off as ink and gold, a yoga throws out its planets' colours, winning showers gold. Each ground has its own weather drifting low behind the fight (embers, dust, wind, mist) and tints the bottom of the leaf. Foes stand in a breathing aura of their planet's colour, health bars and intents are coloured, turn banners sit on a brush stroke (gold for you, red for them), and every new page turns in gently. Slots for the painted art: put the PNGs in `art-src/` and run `npm run art`.
- **1.0.6 (28 Oct 2026):** two portraits for every class, feminine and masculine. Once both are painted, the chart asks which one feels like you (a picture, not a question about who you are) and remembers it; tap your portrait to change it.
