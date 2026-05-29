/**
 * Small selectors that map a calendar date to the matching plan/workout day and
 * resolve the user's current weight. Pure and dependency-light.
 */

import { MEAL_PLAN } from '../data/mealPlan';
import { WORKOUTS } from '../data/workouts';
import type { MealDay, UserProfile, WeightEntry, WorkoutDay } from '../types';
import { todayISO, weekdayIndexMondayFirst } from './dates';
import { latestWeight } from './progress';

/** Index (0-6) into the 7-day plan/workout cycle for a date (Monday-first). */
export function cycleIndexForDate(dateISO: string = todayISO()): number {
  return weekdayIndexMondayFirst(dateISO);
}

/** The plan day matching a date. */
export function mealDayForDate(dateISO: string = todayISO()): MealDay {
  return MEAL_PLAN[cycleIndexForDate(dateISO)];
}

/** The workout day matching a date. */
export function workoutDayForDate(dateISO: string = todayISO()): WorkoutDay {
  return WORKOUTS[cycleIndexForDate(dateISO)];
}

/** Latest logged weight, falling back to the profile's starting weight. */
export function currentWeightKg(profile: UserProfile, entries: WeightEntry[]): number {
  return latestWeight(entries)?.kg ?? profile.startWeightKg;
}
