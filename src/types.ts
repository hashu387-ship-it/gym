/**
 * Shared domain types for FitTrack.
 *
 * These types are intentionally free of any React Native / Expo imports so the
 * calculation layer (`src/logic`) and static data (`src/data`) that depend on
 * them can be unit-tested with plain Node.
 */

/** Biological sex, required by the Mifflin-St Jeor BMR equation. */
export type Sex = 'male' | 'female';

/** Unit system used for display. Internally everything is stored in metric. */
export type Units = 'metric' | 'imperial';

/** Theme preference; 'system' follows the device color scheme. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** Activity level keys mapped to TDEE multipliers in `logic/nutrition`. */
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'veryActive';

/**
 * The single user's profile and preferences.
 *
 * Stored via AsyncStorage (see `src/db/settings.ts`). All weights are in
 * kilograms and height in centimetres regardless of the chosen display units.
 */
export interface UserProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  /** Weight recorded when the user first set up the app. */
  startWeightKg: number;
  /** A self-selected, editable goal weight used for "current vs target". */
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  /**
   * Daily calorie deficit below TDEE. Clamped to the sustainable 500-750 range
   * by `clampDeficit` so the app can never configure a crash diet.
   */
  deficitKcal: number;
  /** Protein target in grams per kg of body weight (1.8-2.2). */
  proteinPerKg: number;
  units: Units;
  themePreference: ThemePreference;
}

/** A single body-weight measurement on a given calendar day. */
export interface WeightEntry {
  /** ISO calendar date, `YYYY-MM-DD`. */
  date: string;
  kg: number;
}

/** One logged working set for an exercise on a given day. */
export interface SetLog {
  id?: number;
  date: string;
  exerciseId: string;
  /** 1-based index of the set within the exercise that day. */
  setIndex: number;
  weightKg: number;
  reps: number;
}

/** A check-off for either a meal item or a workout exercise. */
export interface Completion {
  date: string;
  kind: 'meal' | 'exercise';
  /** Stable id of the meal item or exercise being checked off. */
  refId: string;
  done: boolean;
}

/** Total water logged for a day, in millilitres. */
export interface WaterEntry {
  date: string;
  ml: number;
}

/** Macronutrient triple in grams. */
export interface Macros {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** A food with macros expressed per 100 g of edible portion. */
export interface FoodRef extends Macros {
  id: string;
  name: string;
  /** kcal per 100 g. */
  kcalPer100g: number;
}

/** A meal item: a reference to a food plus the portion eaten. */
export interface MealItem {
  /** Stable id used for check-off persistence. */
  id: string;
  foodId: string;
  grams: number;
  /** Human-friendly portion, e.g. "2 large eggs" or "1 cup cooked". */
  householdMeasure: string;
}

/** A meal item with its computed calories and macros. */
export interface ComputedMealItem extends MealItem {
  name: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type MealSlot = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

/** A single meal within a day's plan. */
export interface Meal {
  slot: MealSlot;
  title: string;
  items: MealItem[];
  /** Simple, macro-equivalent swap suggestions surfaced in the UI. */
  swaps: string[];
}

/** One day of the 7-day rotating meal plan. */
export interface MealDay {
  /** 0 = Day 1 ... 6 = Day 7. */
  index: number;
  title: string;
  meals: Meal[];
}

/** Set/rep prescription for a resistance exercise. */
export interface ExercisePrescription {
  sets: number;
  /** Inclusive rep range, e.g. [6, 8]. Omitted for timed warm-ups/cardio. */
  repRange?: [number, number];
  /** Duration in minutes for timed items (warm-ups, cardio, mobility). */
  durationMin?: number;
  /** Display label for a duration range, e.g. "30-45 min". */
  durationLabel?: string;
  /** "per leg" or similar qualifier shown next to the rep scheme. */
  repNote?: string;
  /** Rest between sets, in seconds. Omitted for warm-ups. */
  restSeconds?: number;
}

/** A single exercise within a workout day. */
export interface Exercise extends ExercisePrescription {
  id: string;
  name: string;
  /** Whether this is a warm-up / cardio / mobility block (not load-logged). */
  isWarmup?: boolean;
  /** One-line coaching cue shown on the detail screen. */
  formCue: string;
  /**
   * Search term used to resolve a representative image and looping demo from a
   * free exercise-media source (wger / ExerciseDB). See `src/lib/media.ts`.
   */
  mediaQuery: string;
}

export type WorkoutFocus =
  | 'Push A'
  | 'Pull A'
  | 'Legs A'
  | 'Push B'
  | 'Pull B'
  | 'Legs B'
  | 'Active recovery';

/** One day of the 6-day Push/Pull/Legs split (plus Sunday recovery). */
export interface WorkoutDay {
  id: string;
  /** Day of week, Monday-first to match the embedded schedule. */
  weekday:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
  focus: WorkoutFocus;
  /** Muscle groups, e.g. "Chest, shoulders, triceps". */
  target: string;
  /** Approximate session length in minutes. */
  approxMin: number;
  /** True for leg days (used to schedule HIIT away from them). */
  isLegDay: boolean;
  exercises: Exercise[];
}

/** Computed daily nutrition targets, derived in `logic/nutrition`. */
export interface NutritionTargets {
  bmr: number;
  tdee: number;
  activityMultiplier: number;
  deficitKcal: number;
  /** TDEE minus deficit, before applying the safety floor. */
  rawTargetCalories: number;
  /** What the app actually recommends: never below the 1,500 kcal floor. */
  recommendedCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPerKg: number;
  /** Projected weekly fat loss at this deficit, in kg. */
  estimatedWeeklyLossKg: number;
  /** True when TDEE minus deficit fell below the 1,500 kcal floor. */
  belowFloor: boolean;
}

/** Severity of a safety note surfaced to the user. */
export type SafetyLevel = 'ok' | 'amber';

/** A single, calmly-worded safety note. */
export interface SafetyNote {
  level: SafetyLevel;
  title: string;
  message: string;
}
