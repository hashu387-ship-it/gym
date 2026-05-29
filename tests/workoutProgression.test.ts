import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateProgression,
  incrementForExercise,
  LOWER_BODY_INCREMENT_KG,
  UPPER_BODY_INCREMENT_KG,
} from '../src/logic/workoutProgression';

test('hitting the top of the range on every set suggests adding load', () => {
  const advice = evaluateProgression(
    [
      { weightKg: 60, reps: 8 },
      { weightKg: 60, reps: 8 },
      { weightKg: 60, reps: 8 },
    ],
    [6, 8],
    UPPER_BODY_INCREMENT_KG,
  );
  assert.equal(advice.shouldIncreaseLoad, true);
  assert.equal(advice.suggestedNextLoadKg, 62.5);
});

test('falling below the range advises holding the load', () => {
  const advice = evaluateProgression(
    [
      { weightKg: 60, reps: 5 },
      { weightKg: 60, reps: 6 },
    ],
    [6, 8],
    UPPER_BODY_INCREMENT_KG,
  );
  assert.equal(advice.shouldIncreaseLoad, false);
  assert.match(advice.message, /below the rep range/);
});

test('inside the range advises pushing toward the top', () => {
  const advice = evaluateProgression(
    [
      { weightKg: 60, reps: 7 },
      { weightKg: 60, reps: 7 },
    ],
    [6, 8],
    UPPER_BODY_INCREMENT_KG,
  );
  assert.equal(advice.shouldIncreaseLoad, false);
  assert.match(advice.message, /toward the top/);
});

test('no logged sets returns a neutral prompt', () => {
  const advice = evaluateProgression([], [6, 8], UPPER_BODY_INCREMENT_KG);
  assert.equal(advice.shouldIncreaseLoad, false);
  assert.match(advice.message, /Log your sets/);
});

test('increment depends on upper vs lower body', () => {
  assert.equal(incrementForExercise(true), LOWER_BODY_INCREMENT_KG);
  assert.equal(incrementForExercise(false), UPPER_BODY_INCREMENT_KG);
});
