/**
 * Progressive-overload logic.
 *
 * The in-app rule, surfaced verbatim on the Workouts screen: when the user hits
 * the top of the prescribed rep range with good form on every working set, add
 * a small load next session. Volume is kept deliberately moderate because
 * recovery is reduced in a calorie deficit.
 */

import type { SetLog } from '../types';

export const PROGRESSION_RULE =
  'When you reach the top of the rep range with good form on every working set, ' +
  'add a small load next session: about 2.5 kg upper body, 5 kg lower body, or ' +
  'the smallest increment available.';

export const UPPER_BODY_INCREMENT_KG = 2.5;
export const LOWER_BODY_INCREMENT_KG = 5;

export interface ProgressionAdvice {
  /** True when every working set reached the top of the rep range. */
  shouldIncreaseLoad: boolean;
  /** Suggested load for the next session, if an increase is warranted. */
  suggestedNextLoadKg?: number;
  message: string;
}

/**
 * Decide whether to add load next session based on the most recent sets for an
 * exercise.
 *
 * @param sets        Logged working sets (weightKg + reps) for one session.
 * @param repRange    Inclusive [bottom, top] rep target for the exercise.
 * @param incrementKg Load step to suggest (upper vs lower body).
 */
export function evaluateProgression(
  sets: Pick<SetLog, 'weightKg' | 'reps'>[],
  repRange: [number, number],
  incrementKg: number,
): ProgressionAdvice {
  const working = sets.filter((s) => s.weightKg > 0 && s.reps > 0);
  const [bottom, top] = repRange;

  if (working.length === 0) {
    return {
      shouldIncreaseLoad: false,
      message: 'Log your sets to get a progression suggestion.',
    };
  }

  const topWeight = Math.max(...working.map((s) => s.weightKg));
  const allHitTop = working.every((s) => s.reps >= top);
  const anyBelowBottom = working.some((s) => s.reps < bottom);

  if (allHitTop) {
    return {
      shouldIncreaseLoad: true,
      suggestedNextLoadKg: topWeight + incrementKg,
      message:
        `You hit the top of the range on every set. Next session, try ` +
        `${topWeight + incrementKg} kg and build the reps back up.`,
    };
  }

  if (anyBelowBottom) {
    return {
      shouldIncreaseLoad: false,
      message:
        'Some sets fell below the rep range. Hold this load and aim to land ' +
        'inside the range with clean form before adding weight.',
    };
  }

  return {
    shouldIncreaseLoad: false,
    message:
      'Good work inside the range. Stay at this load and push toward the top ' +
      'of the range next session.',
  };
}

/** Choose the load increment based on whether the lift is a lower-body movement. */
export function incrementForExercise(isLowerBody: boolean): number {
  return isLowerBody ? LOWER_BODY_INCREMENT_KG : UPPER_BODY_INCREMENT_KG;
}
