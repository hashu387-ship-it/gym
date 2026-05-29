/**
 * Halal food reference table.
 *
 * Macros are per 100 g of edible portion, drawn from standard food-composition
 * values and rounded for clarity. Every item is halal and chosen to be common
 * and affordable in the Gulf region. The meal plan in `mealPlan.ts` composes
 * days from these foods, so changing a value here updates the plan totals.
 */

import type { FoodRef, Macros } from '../types';

export const FOODS: Record<string, FoodRef> = {
  chicken_breast: { id: 'chicken_breast', name: 'Chicken breast, grilled', kcalPer100g: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  white_fish: { id: 'white_fish', name: 'White fish (hammour), grilled', kcalPer100g: 105, proteinG: 23, carbsG: 0, fatG: 1.5 },
  salmon: { id: 'salmon', name: 'Salmon, grilled', kcalPer100g: 208, proteinG: 22, carbsG: 0, fatG: 13 },
  canned_tuna: { id: 'canned_tuna', name: 'Tuna in water, drained', kcalPer100g: 116, proteinG: 26, carbsG: 0, fatG: 1 },
  egg_whole: { id: 'egg_whole', name: 'Egg, whole', kcalPer100g: 143, proteinG: 12.6, carbsG: 0.7, fatG: 9.5 },
  egg_white: { id: 'egg_white', name: 'Egg white', kcalPer100g: 52, proteinG: 10.9, carbsG: 0.7, fatG: 0.2 },
  labneh: { id: 'labneh', name: 'Labneh, low-fat', kcalPer100g: 130, proteinG: 9, carbsG: 5, fatG: 8 },
  greek_yogurt: { id: 'greek_yogurt', name: 'Greek yogurt, 0% fat', kcalPer100g: 59, proteinG: 10.3, carbsG: 3.6, fatG: 0.4 },
  milk_lowfat: { id: 'milk_lowfat', name: 'Low-fat milk', kcalPer100g: 50, proteinG: 3.4, carbsG: 5, fatG: 1.9 },
  lentils: { id: 'lentils', name: 'Lentils, cooked', kcalPer100g: 116, proteinG: 9, carbsG: 20, fatG: 0.4 },
  chickpeas: { id: 'chickpeas', name: 'Chickpeas, cooked', kcalPer100g: 164, proteinG: 8.9, carbsG: 27, fatG: 2.6 },
  foul: { id: 'foul', name: 'Foul mudammas (fava beans)', kcalPer100g: 110, proteinG: 7.6, carbsG: 19.7, fatG: 0.4 },
  hummus: { id: 'hummus', name: 'Hummus', kcalPer100g: 166, proteinG: 8, carbsG: 14, fatG: 10 },
  white_rice: { id: 'white_rice', name: 'White rice, cooked', kcalPer100g: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  brown_rice: { id: 'brown_rice', name: 'Brown rice, cooked', kcalPer100g: 123, proteinG: 2.7, carbsG: 26, fatG: 1 },
  oats: { id: 'oats', name: 'Oats, dry', kcalPer100g: 379, proteinG: 13, carbsG: 67, fatG: 7 },
  arabic_bread: { id: 'arabic_bread', name: 'Arabic bread, whole wheat', kcalPer100g: 270, proteinG: 9, carbsG: 53, fatG: 2 },
  potato: { id: 'potato', name: 'Potato, boiled', kcalPer100g: 87, proteinG: 1.9, carbsG: 20, fatG: 0.1 },
  sweet_potato: { id: 'sweet_potato', name: 'Sweet potato, baked', kcalPer100g: 90, proteinG: 2, carbsG: 21, fatG: 0.1 },
  dates: { id: 'dates', name: 'Dates', kcalPer100g: 277, proteinG: 1.8, carbsG: 75, fatG: 0.2 },
  banana: { id: 'banana', name: 'Banana', kcalPer100g: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3 },
  apple: { id: 'apple', name: 'Apple', kcalPer100g: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2 },
  orange: { id: 'orange', name: 'Orange', kcalPer100g: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1 },
  mixed_veg: { id: 'mixed_veg', name: 'Mixed vegetables, cooked', kcalPer100g: 40, proteinG: 2, carbsG: 8, fatG: 0.3 },
  salad_veg: { id: 'salad_veg', name: 'Cucumber-tomato salad', kcalPer100g: 18, proteinG: 0.8, carbsG: 3.6, fatG: 0.2 },
  olive_oil: { id: 'olive_oil', name: 'Olive oil', kcalPer100g: 884, proteinG: 0, carbsG: 0, fatG: 100 },
  almonds: { id: 'almonds', name: 'Almonds', kcalPer100g: 579, proteinG: 21, carbsG: 22, fatG: 50 },
  peanut_butter: { id: 'peanut_butter', name: 'Peanut butter', kcalPer100g: 588, proteinG: 25, carbsG: 20, fatG: 50 },
  tahini: { id: 'tahini', name: 'Tahini', kcalPer100g: 595, proteinG: 17, carbsG: 21, fatG: 54 },
  whey: { id: 'whey', name: 'Whey protein (halal-certified)', kcalPer100g: 380, proteinG: 78, carbsG: 8, fatG: 6 },
};

/** Look up a food by id, throwing on an unknown id (a data-integrity guard). */
export function getFood(id: string): FoodRef {
  const food = FOODS[id];
  if (!food) throw new Error(`Unknown food id: ${id}`);
  return food;
}

export interface PortionMacros extends Macros {
  kcal: number;
}

/** Compute calories and macros for a given gram portion of a food. */
export function macrosForPortion(food: FoodRef, grams: number): PortionMacros {
  const factor = grams / 100;
  return {
    kcal: food.kcalPer100g * factor,
    proteinG: food.proteinG * factor,
    carbsG: food.carbsG * factor,
    fatG: food.fatG * factor,
  };
}
