/**
 * Calendar-date helpers. All dates in FitTrack are stored as `YYYY-MM-DD`
 * strings in the device's local time zone, which keeps "today" intuitive for a
 * single user and avoids timezone drift in the SQLite history.
 */

/** Format a Date as a local `YYYY-MM-DD` string. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's local date as `YYYY-MM-DD`. */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

/** Parse a `YYYY-MM-DD` string into a local Date at midnight. */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Return the ISO date `n` days after `s` (n may be negative). */
export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Whole days from `a` to `b` (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Monday-first weekday index: Monday = 0 ... Sunday = 6. */
export function weekdayIndexMondayFirst(s: string): number {
  const js = parseISODate(s).getDay(); // Sunday = 0
  return (js + 6) % 7;
}

/**
 * ISO-week key, e.g. `2026-W22`. Used to group weight entries into weekly
 * averages so progress is judged on trend rather than daily swings.
 */
export function isoWeekKey(s: string): string {
  const d = parseISODate(s);
  // ISO week: Thursday determines the year/week number.
  const target = new Date(d.getTime());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);
  const week =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Human-friendly short date, e.g. `29 May 2026`. */
export function formatLongDate(s: string): string {
  const d = parseISODate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Short date without year, e.g. `29 May`. */
export function formatShortDate(s: string): string {
  const d = parseISODate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
