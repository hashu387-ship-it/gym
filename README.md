# Apex

A personal, installable, offline-first web app that combines training, food and
RICS APC study into one calm daily system. Built for a single user (work
Sunday-Thursday, Gulf region), targeting steady fat loss from 98 kg toward
78 kg at a safe pace, with the APC in November.

Live: https://gym-hashu387-ship-its-projects.vercel.app

## Features

- **Bilingual** English / Arabic with full right-to-left support (toggle in the
  header, preference saved).
- **Home** - animated dashboard: daily completion ring, streaks, a rotating
  motivational line, live stat strip, and an hour-by-hour schedule built around
  the real routine **with computed prayer times** (Umm al-Qura) merged in and a
  pulsing now-marker. City selectable (Riyadh, Jeddah, Makkah, Madinah, Dammam).
- **Train** - a 6-day program (Upper/Lower split + recovery walk + weekend
  conditioning) with per-exercise animated demonstrations, form cues and common
  mistakes, a **"Watch video"** link (opens a proper-form search), RPE and rest
  prescriptions, per-set logging, **auto-coaching** that suggests adding load
  when you hit the top of a rep range, a rest-timer sheet with screen wake lock,
  and adaptation/build/push phase guidance.
- **Fuel** - calorie and macro targets recalculated from logged weight, a timed
  meal schedule (workday vs day off), recipes with macros, plate rule, water
  tracker, and Saudi eating-out picks.
- **Study** - RICS APC countdown, focus timer, milestones, QS competencies,
  study streak.
- **Progress** - animated weight chart with goal line, waist log, BMI now vs
  goal, weekly auto-review, editable details, and JSON backup.
- **Installable PWA** - manifest, icon, and a service worker (network-first
  navigations, cache-first assets) so it installs to the home screen and works
  offline.

Health-first: no crash dieting or fat-burner content; steady 0.5-1 kg/week with
doctor / blood-test reminders.

## Structure

```
site/
  index.html     # markup, styles, PWA wiring
  app.js         # all logic: i18n, prayer-time calc, data, renderers
  sw.js          # service worker (offline)
  manifest.json  # PWA manifest
  icon.svg       # app icon
vercel.json      # serves the static site/ directory
```

## Develop / deploy

No build step. Open `site/index.html` in a browser, or serve `site/` with any
static server. Vercel serves `site/` directly (see `vercel.json`); pushing to
`main` deploys.

All data is stored locally in the browser (`localStorage`); there is no backend
and no account.
