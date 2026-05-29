# FitTrack - Product brief

This is the original brief the app implements, kept for traceability. The
implementation honours every data point and constraint below.

## Overview

A production-ready React Native (Expo) mobile app called FitTrack: a personal
fat-loss companion for a single user. No emojis anywhere in UI, copy, or code
comments. Tone of all in-app text is calm, factual, and encouraging - never
shaming or high-pressure.

## User profile (fixed defaults, editable in settings)

Male, age 32, height 165 cm, starting weight 98 kg, full commercial gym access,
halal diet (no pork, no alcohol, no non-halal gelatin), based in Saudi Arabia /
Gulf region.

## Goal and safety model (sustainable track only)

Targets a steady, muscle-preserving rate of fat loss of about 0.5 to 1 kg per
week. No aggressive crash-deficit option. On first launch, a one-time
disclaimer recommends consulting a doctor before starting if the user has any
health conditions, and notes that losing faster than roughly 1 kg per week tends
to cost muscle and rebound. If a logged day implies a deficit steep enough to
risk muscle loss, a calm amber note explains why slower is better. Never
recommend intake below a 1,500 kcal/day floor without surfacing a
doctor-supervision warning.

## Nutrition engine

BMR via Mifflin-St Jeor; TDEE with an adjustable activity multiplier (default
moderate, 1.55). Daily deficit 500 to 750 kcal below TDEE. Protein 1.8 to 2.2 g
per kg of current body weight (recalculated as logged weight changes), fats
about 25 percent of calories, and remaining calories from carbohydrates,
weighted around training. Display calories and protein/carbs/fat targets in
grams, updating with weight.

## Halal meal plan (built in)

A 7-day rotating halal plan, three meals plus two snacks per day, hitting the
daily macro targets, using common affordable Gulf-region foods (chicken, fish,
eggs, labneh, Greek yogurt, lentils, chickpeas, foul, rice, oats, dates, olive
oil, vegetables, fruit). Each item shows calories and macros and has a check-off
toggle. A water tracker with a daily target of about 3 liters. Simple swap
suggestions per meal that keep macros roughly equivalent. All foods halal.

## Workout engine (embedded 6-day Push/Pull/Legs schedule)

Each muscle group is trained twice weekly. Volume is deliberately moderate
because recovery is lower in a deficit. Progressive overload rule shown in-app:
when the user hits the top of a rep range with good form, add a small load next
session. Each exercise needs a representative image and a short looping
demonstration from a free, open-licensed source (for example wger API or
ExerciseDB), with a clean placeholder fallback if media fails, plus the one-line
form cue and per-set logging (weight and reps).

The exact schedule (Mon Push A, Tue Pull A, Wed Legs A, Thu Push B, Fri Pull B,
Sat Legs B, Sun active recovery) is encoded verbatim in
`src/data/workouts.ts`.

## Cardio and steps module

Daily steps target 9,000 to 11,000, presented as the primary fat-loss lever.
Low-intensity cardio 15 to 20 min after 3 to 4 lifting sessions, conversational
pace. HIIT capped at 2 sessions per week, 15 to 20 min, scheduled away from leg
days. Weekly moderate-activity target around 250+ minutes, with steps and
low-intensity counting toward it.

## Navigation (bottom tab bar)

1. Dashboard: current vs target weight, calories and macros remaining today,
   today's workout summary, water progress, a safety status note.
2. Workouts: the weekly split, tappable into per-exercise detail with image,
   animation, form cue, and set logging.
3. Nutrition: today's meals, animated macro rings, the 7-day plan, check-offs,
   water tracker, swap suggestions.
4. Progress: weight-log line chart over time with the projected sustainable
   trend overlaid, weekly average, streaks, and milestone markers.
5. Profile/Settings: editable stats, activity level, units, the disclaimer, and
   data export.

## Guiding principles surfaced in-app

Protein first (about 175 to 200 g/day for this user), progressive overload,
moderate volume in a deficit, 7 to 8 hours sleep plus daily steps, and judge
progress by the weekly average not daily swings.

## Animations and polish

react-native-reanimated and react-native-svg. Smooth purposeful motion only:
macro rings filling, weight-chart line drawing in, tab transitions, exercise
demo loops, subtle haptics on check-off. Modern clean visual design, calm
palette, strong typography, dark-mode support. No emojis.

## Data and persistence

Persist all user data locally (expo-sqlite for logs, AsyncStorage for settings):
weight entries (date, kg), per-set workout logs, workout/meal check-offs, water
intake, and settings. Charts read from this persistent history. No login, single
user. Export-to-JSON option.
