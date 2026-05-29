/**
 * The embedded 6-day Push/Pull/Legs split plus a Sunday active-recovery day.
 *
 * Every exercise, set/rep scheme, rest period, and one-line form cue is fixed
 * per the program brief. Each muscle group is trained twice weekly and volume
 * is deliberately moderate because recovery is reduced in a calorie deficit.
 *
 * `mediaQuery` is the search term used to resolve a representative image and a
 * looping demonstration from a free exercise-media source (see `src/lib/media.ts`),
 * with a clean placeholder fallback when media is unavailable.
 *
 * Exercise ids are derived from (day id, position) so per-set logs persist
 * stably as long as the program order is unchanged.
 */

import type { Exercise, WorkoutDay } from '../types';

type RawExercise = Omit<Exercise, 'id'>;

interface RawDay {
  id: string;
  weekday: WorkoutDay['weekday'];
  focus: WorkoutDay['focus'];
  target: string;
  approxMin: number;
  isLegDay: boolean;
  exercises: RawExercise[];
}

const RAW_WORKOUTS: RawDay[] = [
  {
    id: 'push-a',
    weekday: 'Monday',
    focus: 'Push A',
    target: 'Chest, shoulders, triceps',
    approxMin: 55,
    isLegDay: false,
    exercises: [
      {
        name: 'Treadmill incline walk (warm-up)',
        sets: 1,
        durationMin: 6,
        isWarmup: true,
        formCue: 'Raise heart rate and warm the shoulders before pressing.',
        mediaQuery: 'treadmill incline walk',
      },
      {
        name: 'Barbell bench press',
        sets: 4,
        repRange: [6, 8],
        restSeconds: 120,
        formCue: 'Touch the chest, drive feet into the floor, keep shoulder blades pinned.',
        mediaQuery: 'barbell bench press',
      },
      {
        name: 'Incline dumbbell press',
        sets: 3,
        repRange: [8, 10],
        restSeconds: 90,
        formCue: 'Press slightly back over the eyes, control the lower.',
        mediaQuery: 'incline dumbbell press',
      },
      {
        name: 'Seated shoulder press (machine)',
        sets: 3,
        repRange: [10, 12],
        restSeconds: 75,
        formCue: 'Stop just short of locking out to keep tension on the delts.',
        mediaQuery: 'machine shoulder press',
      },
      {
        name: 'Cable lateral raise',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Lead with the elbow, no swinging, pause at the top.',
        mediaQuery: 'cable lateral raise',
      },
      {
        name: 'Triceps rope pushdown',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Keep elbows tucked, spread the rope at the bottom.',
        mediaQuery: 'triceps rope pushdown',
      },
    ],
  },
  {
    id: 'pull-a',
    weekday: 'Tuesday',
    focus: 'Pull A',
    target: 'Back, rear delts, biceps',
    approxMin: 55,
    isLegDay: false,
    exercises: [
      {
        name: 'Rowing machine (warm-up)',
        sets: 1,
        durationMin: 5,
        isWarmup: true,
        formCue: 'Easy pace to warm the lats and lower back.',
        mediaQuery: 'rowing machine',
      },
      {
        name: 'Lat pulldown (wide)',
        sets: 4,
        repRange: [8, 10],
        restSeconds: 90,
        formCue: 'Pull to the upper chest, drive elbows down, no leaning back.',
        mediaQuery: 'wide grip lat pulldown',
      },
      {
        name: 'Seated cable row',
        sets: 3,
        repRange: [10, 12],
        restSeconds: 90,
        formCue: 'Squeeze the shoulder blades, keep the torso still.',
        mediaQuery: 'seated cable row',
      },
      {
        name: 'Chest-supported dumbbell row',
        sets: 3,
        repRange: [10, 12],
        restSeconds: 75,
        formCue: 'Row to the hip, control the stretch at the bottom.',
        mediaQuery: 'chest supported dumbbell row',
      },
      {
        name: 'Reverse pec-deck (rear delt)',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Light weight, feel it in the rear shoulder not the traps.',
        mediaQuery: 'reverse pec deck rear delt',
      },
      {
        name: 'Dumbbell hammer curl',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'No swing, slow on the way down.',
        mediaQuery: 'dumbbell hammer curl',
      },
    ],
  },
  {
    id: 'legs-a',
    weekday: 'Wednesday',
    focus: 'Legs A',
    target: 'Quads, glutes, calves',
    approxMin: 55,
    isLegDay: true,
    exercises: [
      {
        name: 'Bike (warm-up)',
        sets: 1,
        durationMin: 5,
        isWarmup: true,
        formCue: 'Spin easy, then a few bodyweight squats.',
        mediaQuery: 'stationary bike',
      },
      {
        name: 'Leg press',
        sets: 4,
        repRange: [10, 12],
        restSeconds: 120,
        formCue: 'Feet shoulder-width, do not lock the knees, controlled depth.',
        mediaQuery: 'leg press',
      },
      {
        name: 'Romanian deadlift (dumbbell or barbell)',
        sets: 3,
        repRange: [8, 10],
        restSeconds: 90,
        formCue: 'Hinge at the hips, soft knees, feel the hamstring stretch.',
        mediaQuery: 'romanian deadlift',
      },
      {
        name: 'Walking lunges',
        sets: 3,
        repRange: [10, 10],
        repNote: 'per leg',
        restSeconds: 75,
        formCue: 'Long step, keep the front knee over the ankle.',
        mediaQuery: 'walking lunges',
      },
      {
        name: 'Seated leg curl',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Pause at full contraction, slow release.',
        mediaQuery: 'seated leg curl',
      },
      {
        name: 'Standing calf raise',
        sets: 4,
        repRange: [15, 20],
        restSeconds: 45,
        formCue: 'Full stretch at the bottom, full rise at the top.',
        mediaQuery: 'standing calf raise',
      },
    ],
  },
  {
    id: 'push-b',
    weekday: 'Thursday',
    focus: 'Push B',
    target: 'Shoulders, upper chest, triceps',
    approxMin: 50,
    isLegDay: false,
    exercises: [
      {
        name: 'Arm circles and band pull-apart (warm-up)',
        sets: 1,
        durationMin: 4,
        isWarmup: true,
        formCue: 'Prime the shoulders before pressing overhead.',
        mediaQuery: 'band pull apart',
      },
      {
        name: 'Seated dumbbell shoulder press',
        sets: 4,
        repRange: [8, 10],
        restSeconds: 90,
        formCue: 'Press straight up, ribs down, no arching.',
        mediaQuery: 'seated dumbbell shoulder press',
      },
      {
        name: 'Incline barbell or Smith press',
        sets: 3,
        repRange: [8, 10],
        restSeconds: 90,
        formCue: 'Bar to the upper chest, steady tempo.',
        mediaQuery: 'incline barbell press',
      },
      {
        name: 'Pec-deck or cable fly',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Hug the movement, slight bend in the elbows.',
        mediaQuery: 'pec deck fly',
      },
      {
        name: 'Dumbbell lateral raise',
        sets: 4,
        repRange: [12, 15],
        restSeconds: 45,
        formCue: 'Soft elbows, lift to shoulder height only.',
        mediaQuery: 'dumbbell lateral raise',
      },
      {
        name: 'Overhead cable triceps extension',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Keep the upper arms still, full stretch overhead.',
        mediaQuery: 'overhead cable triceps extension',
      },
    ],
  },
  {
    id: 'pull-b',
    weekday: 'Friday',
    focus: 'Pull B',
    target: 'Back width, traps, biceps',
    approxMin: 50,
    isLegDay: false,
    exercises: [
      {
        name: 'Light lat stretch and face pulls (warm-up)',
        sets: 1,
        durationMin: 4,
        isWarmup: true,
        formCue: 'Open the upper back before heavy pulling.',
        mediaQuery: 'face pull',
      },
      {
        name: 'Assisted pull-up or pulldown',
        sets: 4,
        repRange: [8, 10],
        restSeconds: 90,
        formCue: 'Full hang at the bottom, chin over or to the bar.',
        mediaQuery: 'assisted pull up',
      },
      {
        name: 'Single-arm dumbbell row',
        sets: 3,
        repRange: [10, 12],
        restSeconds: 75,
        formCue: 'Brace on the bench, pull to the hip, no twisting.',
        mediaQuery: 'single arm dumbbell row',
      },
      {
        name: 'Cable face pull',
        sets: 3,
        repRange: [15, 20],
        restSeconds: 60,
        formCue: 'Pull to the forehead, externally rotate at the end.',
        mediaQuery: 'cable face pull',
      },
      {
        name: 'Dumbbell shrug',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Straight up and down, brief pause at the top.',
        mediaQuery: 'dumbbell shrug',
      },
      {
        name: 'Cable or EZ-bar curl',
        sets: 3,
        repRange: [10, 12],
        restSeconds: 60,
        formCue: 'Elbows fixed at the sides, controlled lowering.',
        mediaQuery: 'ez bar curl',
      },
    ],
  },
  {
    id: 'legs-b',
    weekday: 'Saturday',
    focus: 'Legs B',
    target: 'Hamstrings, glutes, quads',
    approxMin: 50,
    isLegDay: true,
    exercises: [
      {
        name: 'Bike or incline walk (warm-up)',
        sets: 1,
        durationMin: 5,
        isWarmup: true,
        formCue: 'Warm the hips and knees thoroughly.',
        mediaQuery: 'stationary bike',
      },
      {
        name: 'Goblet or hack squat',
        sets: 4,
        repRange: [10, 12],
        restSeconds: 120,
        formCue: 'Sit between the hips, chest tall, controlled descent.',
        mediaQuery: 'hack squat',
      },
      {
        name: 'Hip thrust (barbell or machine)',
        sets: 3,
        repRange: [10, 12],
        restSeconds: 90,
        formCue: 'Squeeze the glutes hard at the top, chin tucked.',
        mediaQuery: 'barbell hip thrust',
      },
      {
        name: 'Leg extension',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Pause at the top, do not swing the weight up.',
        mediaQuery: 'leg extension',
      },
      {
        name: 'Lying or seated leg curl',
        sets: 3,
        repRange: [12, 15],
        restSeconds: 60,
        formCue: 'Control both directions, full range.',
        mediaQuery: 'lying leg curl',
      },
      {
        name: 'Seated calf raise',
        sets: 4,
        repRange: [15, 20],
        restSeconds: 45,
        formCue: 'Slow, full range, no bouncing.',
        mediaQuery: 'seated calf raise',
      },
    ],
  },
  {
    id: 'recovery',
    weekday: 'Sunday',
    focus: 'Active recovery',
    target: 'Steps, mobility, rest',
    approxMin: 40,
    isLegDay: false,
    exercises: [
      {
        name: 'Outdoor or treadmill walk',
        sets: 1,
        durationMin: 30,
        durationLabel: '30-45 min',
        isWarmup: true,
        formCue: 'Easy conversational pace.',
        mediaQuery: 'outdoor walk',
      },
      {
        name: 'Full-body mobility and stretching',
        sets: 1,
        durationMin: 10,
        isWarmup: true,
        formCue: 'Hips, shoulders, hamstrings. Gentle, no straining.',
        mediaQuery: 'full body mobility stretching',
      },
    ],
  },
];

/** The built weekly schedule with stable exercise ids. */
export const WORKOUTS: WorkoutDay[] = RAW_WORKOUTS.map((day) => ({
  id: day.id,
  weekday: day.weekday,
  focus: day.focus,
  target: day.target,
  approxMin: day.approxMin,
  isLegDay: day.isLegDay,
  exercises: day.exercises.map((ex, i) => ({ ...ex, id: `${day.id}-${i}` })),
}));

/** Look up a workout day by its id. */
export function getWorkoutDay(id: string): WorkoutDay | undefined {
  return WORKOUTS.find((d) => d.id === id);
}

/** Look up a single exercise across the whole program. */
export function getExercise(exerciseId: string): Exercise | undefined {
  for (const day of WORKOUTS) {
    const found = day.exercises.find((e) => e.id === exerciseId);
    if (found) return found;
  }
  return undefined;
}

/** Weekday names of the leg days, used to schedule HIIT away from them. */
export const LEG_DAYS = WORKOUTS.filter((d) => d.isLegDay).map((d) => d.weekday);

/** Resistance (non-warm-up) exercise ids for a given day. */
export function loggableExerciseIds(dayId: string): string[] {
  const day = getWorkoutDay(dayId);
  if (!day) return [];
  return day.exercises.filter((e) => !e.isWarmup).map((e) => e.id);
}

/** Format a set/rep or duration prescription for display, e.g. "4 x 6-8". */
export function formatPrescription(ex: Exercise): string {
  if (ex.durationLabel) return `${ex.sets} x ${ex.durationLabel}`;
  if (ex.durationMin != null) return `${ex.sets} x ${ex.durationMin} min`;
  if (ex.repRange) {
    const [a, b] = ex.repRange;
    const reps = a === b ? `${a}` : `${a}-${b}`;
    const note = ex.repNote ? ` ${ex.repNote}` : '';
    return `${ex.sets} x ${reps}${note}`;
  }
  return `${ex.sets} sets`;
}
