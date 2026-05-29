/**
 * Dev utility: print each meal-plan day's totals against the computed targets.
 * Run: node --experimental-strip-types scripts/check-meal-plan.ts
 */
import { DEFAULT_PROFILE } from '../src/data/profile.ts';
import { dayTotals, MEAL_PLAN } from '../src/data/mealPlan.ts';
import { computeNutritionTargets } from '../src/logic/nutrition.ts';

const t = computeNutritionTargets(DEFAULT_PROFILE, DEFAULT_PROFILE.startWeightKg);
const tgt = {
  kcal: Math.round(t.recommendedCalories),
  P: Math.round(t.proteinG),
  C: Math.round(t.carbsG),
  F: Math.round(t.fatG),
};
console.log('TARGET', tgt);
console.log('---');
for (const day of MEAL_PLAN) {
  const d = dayTotals(day);
  const kcal = Math.round(d.kcal);
  const P = Math.round(d.proteinG);
  const C = Math.round(d.carbsG);
  const F = Math.round(d.fatG);
  const dk = (((kcal - tgt.kcal) / tgt.kcal) * 100).toFixed(0);
  console.log(
    `${day.title}: ${kcal} kcal (${dk}%)  P${P}  C${C}  F${F}`,
  );
}
