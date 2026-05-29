/**
 * Cardio and steps guidance.
 *
 * Steps are framed as the primary fat-loss lever. Low-intensity cardio is added
 * after lifting sessions; HIIT is capped at two sessions per week and scheduled
 * away from leg days so it does not compromise leg recovery in a deficit.
 */

export const STEPS_TARGET_MIN = 9000;
export const STEPS_TARGET_MAX = 11000;

/** Weekly moderate-activity minutes target (steps + low-intensity count). */
export const WEEKLY_MODERATE_MINUTES_TARGET = 250;

export const HIIT_MAX_PER_WEEK = 2;
export const HIIT_SESSION_MINUTES = '15-20 min';
export const HIIT_EXAMPLE = '30s hard / 90s easy x8 on the bike or rower';

export const LISS_SESSION_MINUTES = '15-20 min';
export const LISS_FREQUENCY = 'after 3-4 lifting sessions';

/** Steps midpoint, handy for a single progress denominator. */
export const STEPS_TARGET_MIDPOINT = Math.round(
  (STEPS_TARGET_MIN + STEPS_TARGET_MAX) / 2,
);

export interface CardioGuidance {
  stepsTargetMin: number;
  stepsTargetMax: number;
  weeklyModerateMinutesTarget: number;
  hiitMaxPerWeek: number;
  hiitSession: string;
  hiitExample: string;
  lissSession: string;
  lissFrequency: string;
  notes: string[];
}

export const CARDIO_GUIDANCE: CardioGuidance = {
  stepsTargetMin: STEPS_TARGET_MIN,
  stepsTargetMax: STEPS_TARGET_MAX,
  weeklyModerateMinutesTarget: WEEKLY_MODERATE_MINUTES_TARGET,
  hiitMaxPerWeek: HIIT_MAX_PER_WEEK,
  hiitSession: HIIT_SESSION_MINUTES,
  hiitExample: HIIT_EXAMPLE,
  lissSession: LISS_SESSION_MINUTES,
  lissFrequency: LISS_FREQUENCY,
  notes: [
    'Steps are the main lever. Aim for 9,000-11,000 a day, every day.',
    'Add 15-20 min of easy, conversational cardio after lifting, 3-4 times a week.',
    'Keep HIIT to at most twice a week and away from leg days so legs recover.',
    'Steps and low-intensity walking both count toward 250+ weekly minutes.',
  ],
};

/**
 * Suggest up to two HIIT days that avoid leg days and the recovery day, spaced
 * apart. Returns weekday names.
 *
 * @param legDays    Weekdays that are leg days (e.g. ['Wednesday','Saturday']).
 * @param restDay    The active-recovery day to avoid (e.g. 'Sunday').
 */
export function suggestHiitDays(legDays: string[], restDay: string): string[] {
  const order = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];
  const avoid = new Set([...legDays, restDay]);
  const candidates = order.filter((d) => !avoid.has(d));
  if (candidates.length <= HIIT_MAX_PER_WEEK) return candidates;
  // Spread the two sessions across the week: take the first and last candidates.
  return [candidates[0], candidates[candidates.length - 1]];
}

/**
 * Estimate moderate-activity minutes contributed by a step count. Roughly
 * 100 steps per minute of walking, so steps / 100 minutes.
 */
export function stepsToModerateMinutes(steps: number): number {
  return Math.round(steps / 100);
}
