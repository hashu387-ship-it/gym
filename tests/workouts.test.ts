import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  WORKOUTS,
  formatPrescription,
  getExercise,
  loggableExerciseIds,
  LEG_DAYS,
} from '../src/data/workouts';

test('the schedule is a 6-day split plus Sunday recovery in weekday order', () => {
  assert.equal(WORKOUTS.length, 7);
  assert.deepEqual(
    WORKOUTS.map((d) => d.weekday),
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  );
  assert.deepEqual(
    WORKOUTS.map((d) => d.focus),
    ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B', 'Active recovery'],
  );
});

test('each muscle group is trained twice weekly', () => {
  const focuses = WORKOUTS.map((d) => d.focus);
  assert.equal(focuses.filter((f) => f.startsWith('Push')).length, 2);
  assert.equal(focuses.filter((f) => f.startsWith('Pull')).length, 2);
  assert.equal(focuses.filter((f) => f.startsWith('Legs')).length, 2);
});

test('the six training days each have a warm-up plus five working exercises', () => {
  for (const day of WORKOUTS.filter((d) => d.focus !== 'Active recovery')) {
    assert.equal(day.exercises.length, 6, `${day.focus} exercise count`);
    assert.equal(day.exercises.filter((e) => e.isWarmup).length, 1);
    assert.equal(loggableExerciseIds(day.id).length, 5);
  }
});

test('working exercises have a rep range, rest, a form cue, and media query', () => {
  for (const day of WORKOUTS) {
    for (const ex of day.exercises) {
      assert.ok(ex.formCue.length > 0, `${ex.name} has a form cue`);
      assert.ok(ex.mediaQuery.length > 0, `${ex.name} has a media query`);
      if (ex.isWarmup) {
        assert.ok(ex.durationMin != null, `${ex.name} warm-up has a duration`);
      } else {
        assert.ok(ex.repRange, `${ex.name} has a rep range`);
        assert.ok(ex.restSeconds != null, `${ex.name} has a rest period`);
      }
    }
  }
});

test('the embedded prescriptions match the program brief exactly (spot checks)', () => {
  const bench = getExercise('push-a-1');
  assert.equal(bench?.name, 'Barbell bench press');
  assert.equal(bench?.sets, 4);
  assert.deepEqual(bench?.repRange, [6, 8]);
  assert.equal(bench?.restSeconds, 120);

  const lunges = getExercise('legs-a-3');
  assert.equal(lunges?.name, 'Walking lunges');
  assert.equal(formatPrescription(lunges!), '3 x 10 per leg');

  const calf = getExercise('legs-b-5');
  assert.equal(calf?.name, 'Seated calf raise');
  assert.equal(formatPrescription(calf!), '4 x 15-20');
});

test('formatPrescription renders sets, reps, and durations', () => {
  const warmup = getExercise('push-a-0');
  assert.equal(formatPrescription(warmup!), '1 x 6 min');
  const walk = getExercise('recovery-0');
  assert.equal(formatPrescription(walk!), '1 x 30-45 min');
});

test('leg days are Wednesday and Saturday and exercise ids are unique', () => {
  assert.deepEqual(LEG_DAYS, ['Wednesday', 'Saturday']);
  const ids = WORKOUTS.flatMap((d) => d.exercises.map((e) => e.id));
  assert.equal(new Set(ids).size, ids.length);
});
