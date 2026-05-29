import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_PROFILE } from '../src/data/profile';
import {
  bmrMifflinStJeor,
  clampDeficit,
  clampProteinPerKg,
  computeNutritionTargets,
  loggedIntakeNotes,
  summarizeSafety,
  targetFloorNotes,
  CALORIE_FLOOR,
} from '../src/logic/nutrition';
import type { UserProfile } from '../src/types';

const approx = (a: number, b: number, eps = 0.5) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ~= ${b}`);

test('Mifflin-St Jeor matches the known formula for the default user', () => {
  // 10*98 + 6.25*165 - 5*32 + 5 = 1856.25
  approx(bmrMifflinStJeor('male', 98, 165, 32), 1856.25);
  // women subtract 161 instead of adding 5
  approx(bmrMifflinStJeor('female', 98, 165, 32), 1856.25 - 166);
});

test('clamping keeps deficit and protein inside the sustainable bands', () => {
  assert.equal(clampDeficit(100), 500);
  assert.equal(clampDeficit(2000), 750);
  assert.equal(clampDeficit(600), 600);
  assert.equal(clampProteinPerKg(1.0), 1.8);
  assert.equal(clampProteinPerKg(3.0), 2.2);
  assert.equal(clampProteinPerKg(2.0), 2.0);
});

test('default targets are computed and above the floor', () => {
  const t = computeNutritionTargets(DEFAULT_PROFILE, 98);
  approx(t.bmr, 1856.25);
  approx(t.tdee, 2877.19, 0.5);
  approx(t.recommendedCalories, 2277.19, 0.5);
  approx(t.proteinG, 196); // 2.0 g/kg * 98
  approx(t.fatG, 63.26, 0.5); // 25% of calories / 9
  approx(t.carbsG, 230.97, 0.5);
  approx(t.estimatedWeeklyLossKg, 0.5455, 0.01);
  assert.equal(t.belowFloor, false);
});

test('macro calories reconcile with the recommended calorie target', () => {
  const t = computeNutritionTargets(DEFAULT_PROFILE, 98);
  const kcal = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
  approx(kcal, t.recommendedCalories, 1);
});

test('protein recalculates as logged weight changes', () => {
  const heavier = computeNutritionTargets(DEFAULT_PROFILE, 98);
  const lighter = computeNutritionTargets(DEFAULT_PROFILE, 90);
  approx(heavier.proteinG, 196);
  approx(lighter.proteinG, 180);
  assert.ok(lighter.proteinG < heavier.proteinG);
});

test('a very low TDEE triggers the calorie floor and a doctor-supervision note', () => {
  const tiny: UserProfile = {
    ...DEFAULT_PROFILE,
    sex: 'female',
    age: 60,
    heightCm: 150,
    deficitKcal: 750,
  };
  const t = computeNutritionTargets(tiny, 45);
  assert.equal(t.recommendedCalories, CALORIE_FLOOR);
  assert.equal(t.belowFloor, true);
  const notes = targetFloorNotes(t);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].level, 'amber');
});

test('logged-intake safety notes escalate correctly', () => {
  const t = computeNutritionTargets(DEFAULT_PROFILE, 98);

  // Under the hard floor.
  assert.equal(loggedIntakeNotes(1400, t)[0].title, 'Below the 1,500 kcal floor');

  // Above floor but implying faster than ~1 kg/week.
  assert.equal(
    loggedIntakeNotes(1600, t)[0].title,
    'Faster than about 1 kg per week',
  );

  // Comfortably above floor but well under target.
  assert.equal(loggedIntakeNotes(1827, t)[0].title, 'Well under target');

  // At target: no note.
  assert.equal(loggedIntakeNotes(Math.round(t.recommendedCalories), t).length, 0);

  // Nothing logged yet: no note.
  assert.equal(loggedIntakeNotes(0, t).length, 0);
});

test('summary is encouraging when on track and amber when not', () => {
  const t = computeNutritionTargets(DEFAULT_PROFILE, 98);
  assert.equal(summarizeSafety(Math.round(t.recommendedCalories), t).level, 'ok');
  assert.equal(summarizeSafety(1200, t).level, 'amber');
});
