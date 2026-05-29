/**
 * Nutrition engine.
 *
 * Implements the calorie and macro model described in the FitTrack brief:
 *   - BMR via the Mifflin-St Jeor equation.
 *   - TDEE via an adjustable activity multiplier (default moderate = 1.55).
 *   - A sustainable 500-750 kcal/day deficit (no crash option).
 *   - Protein 1.8-2.2 g/kg of current body weight.
 *   - Fat at ~25% of calories; carbohydrates fill the remainder.
 *   - A hard 1,500 kcal/day floor that triggers a doctor-supervision warning.
 *
 * Every function is pure so the model can be unit-tested under Node.
 */

import type {
  ActivityLevel,
  NutritionTargets,
  SafetyNote,
  Sex,
  UserProfile,
} from '../types';

// --- Constants -------------------------------------------------------------

/** Activity multipliers applied to BMR to estimate TDEE. */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/** Human-readable labels for the activity levels. */
export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little exercise)',
  light: 'Light (1-3 sessions/week)',
  moderate: 'Moderate (3-5 sessions/week)',
  active: 'Active (6-7 sessions/week)',
  veryActive: 'Very active (physical job + training)',
};

/** Minimum recommended intake. Below this we surface a doctor-supervision note. */
export const CALORIE_FLOOR = 1500;

/** Allowed deficit band. The app cannot configure a steeper (crash) deficit. */
export const DEFICIT_MIN = 500;
export const DEFICIT_MAX = 750;

/** Allowed protein band, in grams per kg of body weight. */
export const PROTEIN_PER_KG_MIN = 1.8;
export const PROTEIN_PER_KG_MAX = 2.2;

/** Share of calories allocated to dietary fat. */
export const FAT_FRACTION_OF_CALORIES = 0.25;

/** Energy content used to convert a deficit into an estimated rate of fat loss. */
export const KCAL_PER_KG_FAT = 7700;

export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_FAT = 9;

/** Sustainable weekly loss band the app is designed around. */
export const MIN_SUSTAINABLE_WEEKLY_LOSS_KG = 0.5;
export const MAX_SUSTAINABLE_WEEKLY_LOSS_KG = 1.0;

/**
 * How far below the daily target a logged intake must fall before we surface a
 * gentle "well under target" note (a softer signal than the hard floor).
 */
export const STEEP_DEFICIT_KCAL_BELOW_TARGET = 400;

// --- Clamping --------------------------------------------------------------

/** Clamp a deficit into the sustainable 500-750 kcal band. */
export function clampDeficit(kcal: number): number {
  return Math.min(DEFICIT_MAX, Math.max(DEFICIT_MIN, Math.round(kcal)));
}

/** Clamp protein-per-kg into the 1.8-2.2 g/kg band. */
export function clampProteinPerKg(v: number): number {
  return Math.min(PROTEIN_PER_KG_MAX, Math.max(PROTEIN_PER_KG_MIN, v));
}

// --- Core equations --------------------------------------------------------

/**
 * Basal Metabolic Rate via Mifflin-St Jeor.
 *   men:   10*kg + 6.25*cm - 5*age + 5
 *   women: 10*kg + 6.25*cm - 5*age - 161
 */
export function bmrMifflinStJeor(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/** Total Daily Energy Expenditure = BMR x activity multiplier. */
export function tdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activity];
}

/**
 * Compute the full set of daily targets for a given current body weight.
 *
 * Protein scales with the supplied `currentWeightKg`, so as logged weight
 * changes the macro targets recalculate automatically. Fat is a fixed share of
 * calories and carbohydrates fill whatever calories remain.
 */
export function computeNutritionTargets(
  profile: UserProfile,
  currentWeightKg: number,
): NutritionTargets {
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel];
  const bmr = bmrMifflinStJeor(
    profile.sex,
    currentWeightKg,
    profile.heightCm,
    profile.age,
  );
  const totalEnergy = bmr * multiplier;

  const deficit = clampDeficit(profile.deficitKcal);
  const rawTarget = totalEnergy - deficit;
  // Never recommend below the floor; macros are computed from the recommendation.
  const recommended = Math.max(rawTarget, CALORIE_FLOOR);

  const proteinPerKg = clampProteinPerKg(profile.proteinPerKg);
  const proteinG = proteinPerKg * currentWeightKg;
  const fatG = (recommended * FAT_FRACTION_OF_CALORIES) / KCAL_PER_G_FAT;

  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcal = fatG * KCAL_PER_G_FAT;
  const carbsG = Math.max(0, (recommended - proteinKcal - fatKcal) / KCAL_PER_G_CARB);

  // Use the effective deficit (after the floor) for the loss estimate so the
  // projection stays honest when the floor binds.
  const effectiveDeficit = totalEnergy - recommended;
  const estimatedWeeklyLossKg = (effectiveDeficit * 7) / KCAL_PER_KG_FAT;

  return {
    bmr,
    tdee: totalEnergy,
    activityMultiplier: multiplier,
    deficitKcal: deficit,
    rawTargetCalories: rawTarget,
    recommendedCalories: recommended,
    proteinG,
    carbsG,
    fatG,
    proteinPerKg,
    estimatedWeeklyLossKg,
    belowFloor: rawTarget < CALORIE_FLOOR,
  };
}

// --- Safety model ----------------------------------------------------------

/**
 * Notes about the target itself (independent of what the user logged). The
 * only target-side note is the floor warning, since the deficit band already
 * keeps the recommended rate of loss within the sustainable range.
 */
export function targetFloorNotes(targets: NutritionTargets): SafetyNote[] {
  if (!targets.belowFloor) return [];
  return [
    {
      level: 'amber',
      title: 'Calorie floor in effect',
      message:
        'A 500-750 kcal deficit would put your target under 1,500 kcal/day, so ' +
        'FitTrack has held it at the 1,500 kcal floor. Eating less than this is ' +
        'not recommended without a doctor supervising your plan.',
    },
  ];
}

/**
 * Notes based on what the user actually ate today. Ordered by severity; the
 * first note is the most important and is what the Dashboard surfaces.
 */
export function loggedIntakeNotes(
  consumedKcal: number,
  targets: NutritionTargets,
): SafetyNote[] {
  if (consumedKcal <= 0) return [];

  const impliedWeeklyLoss = ((targets.tdee - consumedKcal) * 7) / KCAL_PER_KG_FAT;

  if (consumedKcal < CALORIE_FLOOR) {
    return [
      {
        level: 'amber',
        title: 'Below the 1,500 kcal floor',
        message:
          "Today's logged intake is under 1,500 kcal. Very low intake tends to " +
          'cost muscle and leave you short on nutrients. Eating closer to your ' +
          'target is safer; speak with a doctor before keeping intake this low.',
      },
    ];
  }

  if (impliedWeeklyLoss > MAX_SUSTAINABLE_WEEKLY_LOSS_KG) {
    return [
      {
        level: 'amber',
        title: 'Faster than about 1 kg per week',
        message:
          "At today's intake the projected loss is quicker than roughly 1 kg per " +
          'week, which tends to cost muscle and rebound. A little more food, mostly ' +
          'protein, keeps progress steady and easier to hold.',
      },
    ];
  }

  if (consumedKcal < targets.recommendedCalories - STEEP_DEFICIT_KCAL_BELOW_TARGET) {
    return [
      {
        level: 'amber',
        title: 'Well under target',
        message:
          'You are well below your calorie target today. Steady, muscle-preserving ' +
          'loss comes from a moderate deficit, not the largest one. Aim closer to ' +
          'your target unless this was intentional.',
      },
    ];
  }

  return [];
}

/**
 * A single status note for the Dashboard. Returns the most important amber note
 * if any apply, otherwise a calm, encouraging "on track" message.
 */
export function summarizeSafety(
  consumedKcal: number,
  targets: NutritionTargets,
): SafetyNote {
  const notes = [...targetFloorNotes(targets), ...loggedIntakeNotes(consumedKcal, targets)];
  if (notes.length > 0) return notes[0];
  return {
    level: 'ok',
    title: 'On a sustainable track',
    message:
      `Your plan targets about ${MIN_SUSTAINABLE_WEEKLY_LOSS_KG}-${MAX_SUSTAINABLE_WEEKLY_LOSS_KG} kg ` +
      'of fat loss per week. Keep protein high, lift with intent, and judge progress ' +
      'by the weekly average rather than daily swings.',
  };
}
