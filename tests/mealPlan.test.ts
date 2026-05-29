import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_PROFILE } from '../src/data/profile';
import { FOODS } from '../src/data/foods';
import {
  MEAL_PLAN,
  allMealItemIds,
  computeItem,
  dayTotals,
} from '../src/data/mealPlan';
import { computeNutritionTargets } from '../src/logic/nutrition';

const targets = computeNutritionTargets(DEFAULT_PROFILE, DEFAULT_PROFILE.startWeightKg);

test('the plan has 7 days, each with 3 meals plus 2 snacks', () => {
  assert.equal(MEAL_PLAN.length, 7);
  for (const day of MEAL_PLAN) {
    assert.equal(day.meals.length, 5);
    const slots = day.meals.map((m) => m.slot);
    assert.deepEqual(slots, ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner']);
    for (const meal of day.meals) {
      assert.ok(meal.items.length > 0, `${day.title} ${meal.slot} has items`);
      assert.ok(meal.swaps.length > 0, `${day.title} ${meal.slot} has swap suggestions`);
    }
  }
});

test('every meal item references a known halal food', () => {
  for (const day of MEAL_PLAN) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        assert.ok(FOODS[item.foodId], `unknown food: ${item.foodId}`);
      }
    }
  }
});

test('meal-item ids are unique and stable', () => {
  const ids = allMealItemIds();
  assert.equal(new Set(ids).size, ids.length);
});

test('each day lands near the calorie target and meets protein-first guidance', () => {
  for (const day of MEAL_PLAN) {
    const t = dayTotals(day);
    const kcalDeltaPct = Math.abs(t.kcal - targets.recommendedCalories) / targets.recommendedCalories;
    assert.ok(
      kcalDeltaPct <= 0.08,
      `${day.title} calories ${Math.round(t.kcal)} should be within 8% of ${Math.round(
        targets.recommendedCalories,
      )} (was ${(kcalDeltaPct * 100).toFixed(1)}%)`,
    );
    // Protein-first: comfortably above 175 g and not absurdly over.
    assert.ok(t.proteinG >= 178, `${day.title} protein ${t.proteinG.toFixed(0)} >= 178`);
    assert.ok(t.proteinG <= 215, `${day.title} protein ${t.proteinG.toFixed(0)} <= 215`);
    // Fat near ~25% of calories.
    assert.ok(t.fatG >= 50 && t.fatG <= 78, `${day.title} fat ${t.fatG.toFixed(0)} in 50-78 g`);
  }
});

test('computeItem returns positive calories and macros', () => {
  const item = MEAL_PLAN[0].meals[0].items[0];
  const c = computeItem(item);
  assert.ok(c.kcal > 0 && c.proteinG >= 0 && c.carbsG >= 0 && c.fatG >= 0);
  assert.equal(typeof c.name, 'string');
});
