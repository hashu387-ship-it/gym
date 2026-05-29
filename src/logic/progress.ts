/**
 * Progress analytics for the weight history: weekly averages (the metric the
 * app asks the user to judge by), logging streaks, a projected sustainable
 * trend line, and milestone markers.
 */

import type { WeightEntry } from '../types';
import { addDays, daysBetween, isoWeekKey, parseISODate, todayISO } from './dates';

/** Most recent weight entry by date, or undefined when there is no history. */
export function latestWeight(entries: WeightEntry[]): WeightEntry | undefined {
  if (entries.length === 0) return undefined;
  return [...entries].sort((a, b) => a.date.localeCompare(b.date))[entries.length - 1];
}

export interface WeeklyAverage {
  weekKey: string;
  /** First (earliest) date that falls in this week, for chart placement. */
  startDate: string;
  avgKg: number;
  count: number;
}

/**
 * Group entries into ISO weeks and average the weight in each. Weeks are
 * returned in chronological order.
 */
export function weeklyAverages(entries: WeightEntry[]): WeeklyAverage[] {
  const buckets = new Map<string, WeightEntry[]>();
  for (const e of entries) {
    const key = isoWeekKey(e.date);
    const list = buckets.get(key);
    if (list) list.push(e);
    else buckets.set(key, [e]);
  }
  const out: WeeklyAverage[] = [];
  for (const [weekKey, list] of buckets) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const avgKg = sorted.reduce((s, e) => s + e.kg, 0) / sorted.length;
    out.push({ weekKey, startDate: sorted[0].date, avgKg, count: sorted.length });
  }
  return out.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Current logging streak: consecutive calendar days with a weight entry, ending
 * today (or yesterday, so a not-yet-logged today does not reset it to zero).
 */
export function loggingStreak(
  dates: string[],
  today: string = todayISO(),
): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  // The streak is only "current" if the latest entry is today or yesterday.
  let cursor: string;
  if (set.has(today)) cursor = today;
  else if (set.has(addDays(today, -1))) cursor = addDays(today, -1);
  else return 0;

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface TrendPoint {
  date: string;
  kg: number;
}

/**
 * Project a sustainable downward trend from a starting weight at a fixed weekly
 * rate of loss. Used as an overlay on the weight chart so daily swings can be
 * read against the expected path.
 *
 * @param startKg        Weight at `startDate`.
 * @param startDate      ISO date the projection begins.
 * @param ratePerWeekKg  Expected weekly loss (positive number).
 * @param endDate        ISO date to project to.
 */
export function projectedTrend(
  startKg: number,
  startDate: string,
  ratePerWeekKg: number,
  endDate: string,
): TrendPoint[] {
  const totalDays = Math.max(0, daysBetween(startDate, endDate));
  const points: TrendPoint[] = [];
  // One point per week plus a final point at the end date.
  for (let day = 0; day <= totalDays; day += 7) {
    const weeks = day / 7;
    points.push({ date: addDays(startDate, day), kg: startKg - ratePerWeekKg * weeks });
  }
  if (totalDays % 7 !== 0) {
    points.push({
      date: endDate,
      kg: startKg - ratePerWeekKg * (totalDays / 7),
    });
  }
  return points;
}

export interface Milestone {
  label: string;
  kg: number;
  achieved: boolean;
}

/**
 * Build milestone markers from the starting weight down to the goal, every 4 kg,
 * with the goal as the final marker. A milestone is achieved once current weight
 * has reached or dropped below it.
 */
export function milestones(
  startKg: number,
  goalKg: number,
  currentKg: number,
): Milestone[] {
  const out: Milestone[] = [];
  const step = 4;
  for (let kg = startKg - step; kg > goalKg; kg -= step) {
    const lost = Math.round(startKg - kg);
    out.push({ label: `-${lost} kg`, kg, achieved: currentKg <= kg });
  }
  out.push({
    label: `Goal ${Math.round(goalKg)} kg`,
    kg: goalKg,
    achieved: currentKg <= goalKg,
  });
  return out;
}

/** Total change from the first to the latest entry (negative = loss). */
export function totalChangeKg(entries: WeightEntry[]): number {
  if (entries.length < 2) return 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[sorted.length - 1].kg - sorted[0].kg;
}

/** Average weekly change across the logged span (negative = loss per week). */
export function averageWeeklyChangeKg(entries: WeightEntry[]): number {
  if (entries.length < 2) return 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const span = daysBetween(sorted[0].date, sorted[sorted.length - 1].date);
  if (span <= 0) return 0;
  const change = sorted[sorted.length - 1].kg - sorted[0].kg;
  return (change / span) * 7;
}

/** Convenience: parse helper re-export so screens import dates from one place. */
export { parseISODate };
