# FitTrack

A personal, offline-first fat-loss companion built with Expo (React Native +
TypeScript). FitTrack is designed for a single user and built around a
sustainable, muscle-preserving rate of fat loss of about 0.5 to 1 kg per week.

> FitTrack is a personal guide, not medical advice. Consult a doctor before
> starting any diet or training plan, especially if you have a health
> condition.

## Features

- **Dashboard** - current vs target weight, calories and macros remaining today
  (animated rings), today's workout summary, water progress, and a calm safety
  status note.
- **Workouts** - the embedded 6-day Push/Pull/Legs split (plus Sunday active
  recovery), the progressive-overload rule, and cardio/steps guidance. Each day
  opens to its exercises; each exercise has a looping on-device animation of the
  movement (or a real GIF if an ExerciseDB key is set), a one-line form cue, and
  per-set logging (weight and reps).
- **Nutrition** - a built-in 7-day rotating halal meal plan (3 meals + 2 snacks
  per day) using affordable Gulf-region staples, animated macro rings, per-item
  check-offs, macro-equivalent swap suggestions, and a ~3 L water tracker.
- **Progress** - a weight line chart that draws itself in, with the projected
  sustainable trend overlaid, weekly averages, a logging streak, and milestone
  markers.
- **Profile / Settings** - editable stats, activity level, deficit and protein
  targets, units (metric/imperial), light/dark/system theme, the guiding
  principles, the safety disclaimer, and export-to-JSON.

No login, no account, no cloud. All data stays on the device.

## Tech stack

- Expo SDK 56, React Native 0.85, expo-router (file-based navigation)
- react-native-reanimated + react-native-svg for animation (macro rings,
  chart line draw-in, tab transitions) and expo-haptics for tactile feedback
- expo-sqlite for logs, AsyncStorage for settings, expo-file-system +
  expo-sharing for JSON export
- TypeScript throughout; calculation logic is framework-free and unit-tested

## Getting started

Prerequisites: Node 18+ and the Expo tooling (`npx expo`). To run on a device,
install Expo Go, or build a development client.

```bash
npm install
npm start          # then press i / a, or scan the QR code with Expo Go
# or target a platform directly:
npm run ios
npm run android
npm run web
```

### Exercise media and API keys

Every exercise shows a looping on-device animation of its movement pattern
(built with react-native-svg + reanimated). These need no configuration, no
network, and no API key, and work on web and native.

Optionally, set an ExerciseDB (RapidAPI) key to show real demonstration GIFs
instead: copy `.env.example` to `.env` and set `EXPO_PUBLIC_EXERCISEDB_API_KEY`
(see the file). Without a key, the built-in animations are used.

## Nutrition and safety model

- **BMR** via Mifflin-St Jeor; **TDEE** = BMR x activity multiplier (default
  moderate, 1.55).
- **Deficit** is clamped to a sustainable 500-750 kcal/day, so the app cannot
  configure a crash diet.
- **Protein** 1.8-2.2 g/kg of current body weight (recalculated as logged
  weight changes), **fat** ~25% of calories, **carbohydrates** fill the
  remainder and are weighted around training.
- A hard **1,500 kcal/day floor**: if a deficit would push the target below it,
  the target is held at 1,500 and a doctor-supervision note is shown. Logged
  intake that is very low, or that implies losing faster than ~1 kg/week, raises
  a calm amber note.

For the default profile (male, 32, 165 cm, 98 kg, moderate activity, 600 kcal
deficit) this yields about 2,277 kcal/day with ~196 g protein, ~231 g carbs,
and ~63 g fat. Every day of the built-in meal plan is verified to land within
8% of the calorie target and to meet the protein-first guidance.

## Data and persistence

SQLite (`fittrack.db`) stores `weight_entries`, `set_logs`, `completions`
(meal and workout check-offs), and `water`. The profile and app flags live in
AsyncStorage. The charts read from this persistent history. Profile > Your data
> "Export data to JSON" writes a full backup and opens the share sheet.

## Project structure

```
src/
  app/                     # expo-router screens
    _layout.tsx            # providers + stack + disclaimer gate
    (tabs)/                # Dashboard, Workouts, Nutrition, Progress, Profile
    workout/[dayId].tsx    # a day's exercises
    exercise/[exerciseId].tsx  # media, form cue, progression, set logging
  components/              # UI primitives + animated rings, chart, etc.
  constants/theme.ts       # calm palette, spacing, type ramp, radii
  data/                    # foods, 7-day meal plan, workout split, guidance
  db/                      # SQLite layer + AsyncStorage settings
  lib/                     # exercise media resolver, JSON export
  logic/                   # framework-free engines (nutrition, progression,
                           # cardio, progress analytics) - all unit-tested
  providers/               # app-data and theme contexts
tests/                     # Node unit tests for logic and data
docs/SPEC.md               # the original product brief
```

## Scripts

```bash
npm test           # unit tests for the calculation logic and meal-plan math
npm run typecheck  # tsc --noEmit
npm run check:meals  # print each plan day's totals vs the computed targets
npm run lint       # expo lint
```

## Notes and limitations

- App icons and the splash image are Expo's default placeholders; replace the
  files in `assets/images` for a production build.
- Exercise demonstrations are on-device animations and work offline. A real GIF
  source (ExerciseDB) is optional and requires an API key.
- The native app must be run via Expo on a device or simulator; it cannot be
  exercised headlessly.
