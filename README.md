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
| `src/content.ts` | Working names and draft rules: the nine planet enemies, the ground each element gives, rest-place gifts by house lord, the twelve daily Moon effects. |
| `src/today.ts` | Today's Moon, counted from your lagna. |
| `src/rng.ts` | Seeded randomness from the birth seed and run number. |
| `src/main.ts` | The screens. |
| `capacitor.config.json` | App id and name for Android (JSON, so it works with any TypeScript or Node version). |
| `src/store.ts` | Saving on the phone only. |
| `tests/` | `engine.test.cjs` (a known chart, old Sri Lankan time), `rng.test.ts` (seeded randomness) and `screens.py` (phone-sized screen checks with Playwright). |

## Rules

- Birth data stays on the device. No accounts, nothing sent anywhere.
- Readings are labelled "for entertainment and self-reflection".
- No new features once building starts; ideas go on the parked list in the spec.

## Build log

- **Day 1 (24 Oct 2026):** project shell (Vite, TypeScript, Capacitor 8, Android target API 36), the engine copied in, birth entry with offline place search and map coordinates, the chart and the twelve-house seed on screen, birth kept on the phone.
- **Day 2 (25 Oct 2026):** the chart is now the run map: ink hatching shows fights, bosses and the final gate, a dotted red line shows where you stand, and tapping a house shows its ground, its enemies or its rest-place gift. Today's Moon modifier, seeded randomness, Latin-only fonts.
