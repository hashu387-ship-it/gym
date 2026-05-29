/**
 * Maps each exercise to a movement-pattern animation (see ExerciseAnimation).
 *
 * These looping SVG animations render entirely on-device with no API key and no
 * network, so every exercise always shows a demonstration. If an ExerciseDB API
 * key is configured, a real looping GIF is shown instead (see src/lib/media.ts).
 */

export type AnimationPattern =
  | 'press'
  | 'pull'
  | 'row'
  | 'lateralRaise'
  | 'curl'
  | 'squat'
  | 'hinge'
  | 'legExtension'
  | 'calf'
  | 'cardio'
  | 'mobility';

/** Exercise id -> movement pattern. Ids come from src/data/workouts.ts. */
const PATTERN_BY_ID: Record<string, AnimationPattern> = {
  // Push A
  'push-a-0': 'cardio', // treadmill warm-up
  'push-a-1': 'press', // barbell bench press
  'push-a-2': 'press', // incline dumbbell press
  'push-a-3': 'press', // machine shoulder press
  'push-a-4': 'lateralRaise', // cable lateral raise
  'push-a-5': 'press', // triceps rope pushdown
  // Pull A
  'pull-a-0': 'cardio', // rowing warm-up
  'pull-a-1': 'pull', // lat pulldown
  'pull-a-2': 'row', // seated cable row
  'pull-a-3': 'row', // chest-supported dumbbell row
  'pull-a-4': 'row', // reverse pec-deck
  'pull-a-5': 'curl', // hammer curl
  // Legs A
  'legs-a-0': 'cardio', // bike warm-up
  'legs-a-1': 'squat', // leg press
  'legs-a-2': 'hinge', // romanian deadlift
  'legs-a-3': 'squat', // walking lunges
  'legs-a-4': 'legExtension', // seated leg curl
  'legs-a-5': 'calf', // standing calf raise
  // Push B
  'push-b-0': 'mobility', // arm circles / band pull-apart
  'push-b-1': 'press', // seated dumbbell shoulder press
  'push-b-2': 'press', // incline barbell / Smith press
  'push-b-3': 'press', // pec-deck or cable fly
  'push-b-4': 'lateralRaise', // dumbbell lateral raise
  'push-b-5': 'press', // overhead cable triceps extension
  // Pull B
  'pull-b-0': 'mobility', // lat stretch / face pulls warm-up
  'pull-b-1': 'pull', // assisted pull-up or pulldown
  'pull-b-2': 'row', // single-arm dumbbell row
  'pull-b-3': 'row', // cable face pull
  'pull-b-4': 'pull', // dumbbell shrug
  'pull-b-5': 'curl', // cable or EZ-bar curl
  // Legs B
  'legs-b-0': 'cardio', // bike / incline walk warm-up
  'legs-b-1': 'squat', // goblet or hack squat
  'legs-b-2': 'squat', // hip thrust
  'legs-b-3': 'legExtension', // leg extension
  'legs-b-4': 'legExtension', // lying or seated leg curl
  'legs-b-5': 'calf', // seated calf raise
  // Recovery
  'recovery-0': 'cardio', // walk
  'recovery-1': 'mobility', // mobility and stretching
};

export function getExercisePattern(exerciseId: string): AnimationPattern {
  return PATTERN_BY_ID[exerciseId] ?? 'mobility';
}
