/**
 * Built-in 7-day rotating halal meal plan.
 *
 * Each day has three meals plus two snacks and is designed to land near the
 * default user's targets at the 98 kg starting weight (about 2,280 kcal, ~195 g
 * protein, ~63 g fat, ~230 g carbohydrate). As body weight and targets change,
 * the plan is a reference template: portions can be scaled up or down. The
 * accompanying unit test (`tests/mealPlan.test.ts`) asserts every day stays
 * within tolerance of the targets and meets the protein-first guidance.
 *
 * Item ids are derived deterministically from (day index, slot, position) so
 * check-off state persists stably as long as the plan order is unchanged.
 */

import type {
  ComputedMealItem,
  Meal,
  MealDay,
  MealItem,
  MealSlot,
} from '../types';
import { getFood, macrosForPortion, type PortionMacros } from './foods';

interface RawItem {
  foodId: string;
  grams: number;
  householdMeasure: string;
}
interface RawMeal {
  slot: MealSlot;
  title: string;
  items: RawItem[];
  swaps: string[];
}
interface RawDay {
  title: string;
  meals: RawMeal[];
}

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  snack1: 'Snack',
  lunch: 'Lunch',
  snack2: 'Snack',
  dinner: 'Dinner',
};

const RAW_PLAN: RawDay[] = [
  {
    title: 'Day 1',
    meals: [
      {
        slot: 'breakfast',
        title: 'Oats, yogurt and banana',
        items: [
          { foodId: 'oats', grams: 60, householdMeasure: '2/3 cup dry' },
          { foodId: 'greek_yogurt', grams: 170, householdMeasure: '3/4 cup' },
          { foodId: 'banana', grams: 100, householdMeasure: '1 medium' },
          { foodId: 'almonds', grams: 20, householdMeasure: 'small handful' },
        ],
        swaps: [
          'Swap banana for an apple or orange for similar carbs.',
          'Swap almonds for 1 tbsp peanut butter.',
        ],
      },
      {
        slot: 'snack1',
        title: 'Labneh with bread',
        items: [
          { foodId: 'labneh', grams: 120, householdMeasure: '1/2 cup' },
          { foodId: 'arabic_bread', grams: 50, householdMeasure: '1 small loaf' },
          { foodId: 'salad_veg', grams: 100, householdMeasure: 'side salad' },
        ],
        swaps: ['Swap labneh for low-fat Greek yogurt to lower fat slightly.'],
      },
      {
        slot: 'lunch',
        title: 'Grilled chicken and rice',
        items: [
          { foodId: 'chicken_breast', grams: 195, householdMeasure: '1 large fillet' },
          { foodId: 'white_rice', grams: 150, householdMeasure: '3/4 cup cooked' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 10, householdMeasure: '2 tsp' },
        ],
        swaps: [
          'Swap chicken for white fish or tuna for similar protein.',
          'Swap white rice for boiled potato or brown rice.',
        ],
      },
      {
        slot: 'snack2',
        title: 'Protein shake and fruit',
        items: [
          { foodId: 'whey', grams: 30, householdMeasure: '1 scoop' },
          { foodId: 'apple', grams: 150, householdMeasure: '1 medium' },
        ],
        swaps: ['Swap whey for 200 g Greek yogurt if you prefer whole foods.'],
      },
      {
        slot: 'dinner',
        title: 'Baked fish with potato',
        items: [
          { foodId: 'white_fish', grams: 200, householdMeasure: '1 fillet' },
          { foodId: 'potato', grams: 200, householdMeasure: '1 large' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 13, householdMeasure: '1 tbsp' },
        ],
        swaps: ['Swap potato for sweet potato or rice for similar carbs.'],
      },
    ],
  },
  {
    title: 'Day 2',
    meals: [
      {
        slot: 'breakfast',
        title: 'Foul with eggs',
        items: [
          { foodId: 'foul', grams: 200, householdMeasure: '1 cup' },
          { foodId: 'egg_whole', grams: 100, householdMeasure: '2 eggs' },
          { foodId: 'arabic_bread', grams: 60, householdMeasure: '1 loaf' },
          { foodId: 'olive_oil', grams: 5, householdMeasure: '1 tsp' },
        ],
        swaps: ['Swap 1 whole egg for 2 egg whites to lower fat.'],
      },
      {
        slot: 'snack1',
        title: 'Yogurt with dates',
        items: [
          { foodId: 'greek_yogurt', grams: 200, householdMeasure: '1 cup' },
          { foodId: 'dates', grams: 24, householdMeasure: '3 dates' },
          { foodId: 'almonds', grams: 15, householdMeasure: 'small handful' },
        ],
        swaps: ['Swap dates for a banana for similar carbs.'],
      },
      {
        slot: 'lunch',
        title: 'Chicken and rice bowl',
        items: [
          { foodId: 'chicken_breast', grams: 190, householdMeasure: '1 large fillet' },
          { foodId: 'white_rice', grams: 180, householdMeasure: '1 cup cooked' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 7, householdMeasure: '1.5 tsp' },
        ],
        swaps: ['Swap rice for potato; swap chicken for grilled fish.'],
      },
      {
        slot: 'snack2',
        title: 'Labneh and fruit',
        items: [
          { foodId: 'labneh', grams: 100, householdMeasure: '1/2 cup' },
          { foodId: 'apple', grams: 150, householdMeasure: '1 medium' },
        ],
        swaps: ['Swap labneh for cottage-style cheese if available.'],
      },
      {
        slot: 'dinner',
        title: 'Tuna with potato',
        items: [
          { foodId: 'canned_tuna', grams: 200, householdMeasure: '2 small cans' },
          { foodId: 'potato', grams: 200, householdMeasure: '1 large' },
          { foodId: 'salad_veg', grams: 150, householdMeasure: 'large salad' },
          { foodId: 'olive_oil', grams: 14, householdMeasure: '1 tbsp' },
        ],
        swaps: ['Swap tuna for white fish or chicken for similar protein.'],
      },
    ],
  },
  {
    title: 'Day 3',
    meals: [
      {
        slot: 'breakfast',
        title: 'Yogurt oat bowl',
        items: [
          { foodId: 'greek_yogurt', grams: 200, householdMeasure: '1 cup' },
          { foodId: 'oats', grams: 50, householdMeasure: '1/2 cup dry' },
          { foodId: 'dates', grams: 24, householdMeasure: '3 dates' },
          { foodId: 'almonds', grams: 15, householdMeasure: 'small handful' },
        ],
        swaps: ['Swap oats for a slice of Arabic bread.'],
      },
      {
        slot: 'snack1',
        title: 'Hummus and bread',
        items: [
          { foodId: 'hummus', grams: 100, householdMeasure: '1/2 cup' },
          { foodId: 'arabic_bread', grams: 60, householdMeasure: '1 loaf' },
          { foodId: 'salad_veg', grams: 100, householdMeasure: 'side salad' },
        ],
        swaps: ['Swap hummus for labneh for more protein, less fat.'],
      },
      {
        slot: 'lunch',
        title: 'Grilled salmon and rice',
        items: [
          { foodId: 'salmon', grams: 160, householdMeasure: '1 fillet' },
          { foodId: 'white_rice', grams: 150, householdMeasure: '3/4 cup cooked' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
        ],
        swaps: ['Swap salmon for white fish to lower fat and calories.'],
      },
      {
        slot: 'snack2',
        title: 'Protein shake',
        items: [
          { foodId: 'whey', grams: 30, householdMeasure: '1 scoop' },
          { foodId: 'banana', grams: 100, householdMeasure: '1 medium' },
        ],
        swaps: ['Swap whey for 200 g Greek yogurt.'],
      },
      {
        slot: 'dinner',
        title: 'Chicken with lentils',
        items: [
          { foodId: 'chicken_breast', grams: 185, householdMeasure: '1 fillet' },
          { foodId: 'lentils', grams: 200, householdMeasure: '1 cup cooked' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 8, householdMeasure: '1.5 tsp' },
        ],
        swaps: ['Swap lentils for chickpeas or rice for similar carbs.'],
      },
    ],
  },
  {
    title: 'Day 4',
    meals: [
      {
        slot: 'breakfast',
        title: 'Egg-white omelette',
        items: [
          { foodId: 'egg_white', grams: 200, householdMeasure: '6 egg whites' },
          { foodId: 'egg_whole', grams: 50, householdMeasure: '1 egg' },
          { foodId: 'arabic_bread', grams: 75, householdMeasure: '1 large loaf' },
          { foodId: 'olive_oil', grams: 8, householdMeasure: '1.5 tsp' },
        ],
        swaps: ['Swap bread for oats for slower-release carbs.'],
      },
      {
        slot: 'snack1',
        title: 'Yogurt and almonds',
        items: [
          { foodId: 'greek_yogurt', grams: 200, householdMeasure: '1 cup' },
          { foodId: 'almonds', grams: 20, householdMeasure: 'small handful' },
          { foodId: 'orange', grams: 130, householdMeasure: '1 medium' },
        ],
        swaps: ['Swap orange for an apple or pear.'],
      },
      {
        slot: 'lunch',
        title: 'Chicken rice plate',
        items: [
          { foodId: 'chicken_breast', grams: 190, householdMeasure: '1 large fillet' },
          { foodId: 'white_rice', grams: 200, householdMeasure: '1 cup cooked' },
          { foodId: 'salad_veg', grams: 150, householdMeasure: 'large salad' },
          { foodId: 'olive_oil', grams: 8, householdMeasure: '1.5 tsp' },
        ],
        swaps: ['Swap chicken for grilled fish; swap rice for potato.'],
      },
      {
        slot: 'snack2',
        title: 'Dates and milk',
        items: [
          { foodId: 'milk_lowfat', grams: 250, householdMeasure: '1 glass' },
          { foodId: 'dates', grams: 40, householdMeasure: '5 dates' },
        ],
        swaps: ['Swap milk for a whey shake for more protein.'],
      },
      {
        slot: 'dinner',
        title: 'White fish and sweet potato',
        items: [
          { foodId: 'white_fish', grams: 220, householdMeasure: '1 large fillet' },
          { foodId: 'sweet_potato', grams: 280, householdMeasure: '1 large' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 10, householdMeasure: '2 tsp' },
        ],
        swaps: ['Swap sweet potato for regular potato or rice.'],
      },
    ],
  },
  {
    title: 'Day 5',
    meals: [
      {
        slot: 'breakfast',
        title: 'Labneh, egg and bread',
        items: [
          { foodId: 'labneh', grams: 120, householdMeasure: '1/2 cup' },
          { foodId: 'egg_whole', grams: 100, householdMeasure: '2 eggs' },
          { foodId: 'arabic_bread', grams: 80, householdMeasure: '1 large loaf' },
        ],
        swaps: ['Swap 1 egg for 2 whites to lower fat.'],
      },
      {
        slot: 'snack1',
        title: 'Protein shake and fruit',
        items: [
          { foodId: 'whey', grams: 30, householdMeasure: '1 scoop' },
          { foodId: 'apple', grams: 150, householdMeasure: '1 medium' },
        ],
        swaps: ['Swap whey for 200 g Greek yogurt.'],
      },
      {
        slot: 'lunch',
        title: 'Chicken and chickpeas',
        items: [
          { foodId: 'chicken_breast', grams: 180, householdMeasure: '1 large fillet' },
          { foodId: 'chickpeas', grams: 180, householdMeasure: '1 cup cooked' },
          { foodId: 'salad_veg', grams: 150, householdMeasure: 'large salad' },
          { foodId: 'olive_oil', grams: 8, householdMeasure: '1.5 tsp' },
        ],
        swaps: ['Swap chickpeas for rice or potato for similar carbs.'],
      },
      {
        slot: 'snack2',
        title: 'Yogurt and dates',
        items: [
          { foodId: 'greek_yogurt', grams: 170, householdMeasure: '3/4 cup' },
          { foodId: 'dates', grams: 30, householdMeasure: '4 dates' },
        ],
        swaps: ['Swap dates for a small banana.'],
      },
      {
        slot: 'dinner',
        title: 'Grilled salmon and salad',
        items: [
          { foodId: 'salmon', grams: 170, householdMeasure: '1 fillet' },
          { foodId: 'potato', grams: 280, householdMeasure: '1 large' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
        ],
        swaps: ['Swap salmon for white fish to lower calories.'],
      },
    ],
  },
  {
    title: 'Day 6',
    meals: [
      {
        slot: 'breakfast',
        title: 'Oats protein bowl',
        items: [
          { foodId: 'oats', grams: 60, householdMeasure: '2/3 cup dry' },
          { foodId: 'whey', grams: 30, householdMeasure: '1 scoop' },
          { foodId: 'milk_lowfat', grams: 200, householdMeasure: '1 glass' },
          { foodId: 'banana', grams: 100, householdMeasure: '1 medium' },
        ],
        swaps: ['Swap milk for water and use 250 g Greek yogurt.'],
      },
      {
        slot: 'snack1',
        title: 'Labneh and bread',
        items: [
          { foodId: 'labneh', grams: 100, householdMeasure: '1/2 cup' },
          { foodId: 'arabic_bread', grams: 50, householdMeasure: '1 small loaf' },
          { foodId: 'salad_veg', grams: 100, householdMeasure: 'side salad' },
        ],
        swaps: ['Swap labneh for hummus for a plant-based option.'],
      },
      {
        slot: 'lunch',
        title: 'Tuna rice bowl',
        items: [
          { foodId: 'canned_tuna', grams: 210, householdMeasure: '2 small cans' },
          { foodId: 'white_rice', grams: 180, householdMeasure: '1 cup cooked' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 10, householdMeasure: '2 tsp' },
        ],
        swaps: ['Swap tuna for chicken; swap rice for potato.'],
      },
      {
        slot: 'snack2',
        title: 'Fruit and almonds',
        items: [
          { foodId: 'orange', grams: 130, householdMeasure: '1 medium' },
          { foodId: 'almonds', grams: 20, householdMeasure: 'small handful' },
        ],
        swaps: ['Swap almonds for 1 tbsp peanut butter.'],
      },
      {
        slot: 'dinner',
        title: 'Chicken and rice',
        items: [
          { foodId: 'chicken_breast', grams: 195, householdMeasure: '1 large fillet' },
          { foodId: 'white_rice', grams: 150, householdMeasure: '3/4 cup cooked' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 10, householdMeasure: '2 tsp' },
        ],
        swaps: ['Swap chicken for white fish for similar protein.'],
      },
    ],
  },
  {
    title: 'Day 7',
    meals: [
      {
        slot: 'breakfast',
        title: 'Foul with eggs and bread',
        items: [
          { foodId: 'foul', grams: 200, householdMeasure: '1 cup' },
          { foodId: 'egg_whole', grams: 100, householdMeasure: '2 eggs' },
          { foodId: 'arabic_bread', grams: 50, householdMeasure: '1 small loaf' },
          { foodId: 'olive_oil', grams: 5, householdMeasure: '1 tsp' },
        ],
        swaps: ['Swap 1 egg for 2 whites to lower fat.'],
      },
      {
        slot: 'snack1',
        title: 'Protein shake and fruit',
        items: [
          { foodId: 'whey', grams: 30, householdMeasure: '1 scoop' },
          { foodId: 'banana', grams: 100, householdMeasure: '1 medium' },
        ],
        swaps: ['Swap whey for 200 g Greek yogurt.'],
      },
      {
        slot: 'lunch',
        title: 'Chicken and potato',
        items: [
          { foodId: 'chicken_breast', grams: 190, householdMeasure: '1 large fillet' },
          { foodId: 'potato', grams: 250, householdMeasure: '1 large' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 10, householdMeasure: '2 tsp' },
        ],
        swaps: ['Swap potato for rice; swap chicken for fish.'],
      },
      {
        slot: 'snack2',
        title: 'Yogurt with almonds',
        items: [
          { foodId: 'greek_yogurt', grams: 200, householdMeasure: '1 cup' },
          { foodId: 'almonds', grams: 22, householdMeasure: 'small handful' },
        ],
        swaps: ['Swap almonds for a few dates for more carbs.'],
      },
      {
        slot: 'dinner',
        title: 'White fish with rice',
        items: [
          { foodId: 'white_fish', grams: 200, householdMeasure: '1 fillet' },
          { foodId: 'white_rice', grams: 150, householdMeasure: '3/4 cup cooked' },
          { foodId: 'mixed_veg', grams: 150, householdMeasure: '1.5 cups' },
          { foodId: 'olive_oil', grams: 12, householdMeasure: '1 tbsp' },
        ],
        swaps: ['Swap rice for potato or sweet potato.'],
      },
    ],
  },
];

function buildItem(
  dayIndex: number,
  slot: MealSlot,
  position: number,
  raw: RawItem,
): MealItem {
  return {
    id: `${dayIndex}-${slot}-${position}`,
    foodId: raw.foodId,
    grams: raw.grams,
    householdMeasure: raw.householdMeasure,
  };
}

/** The built plan with stable item ids. */
export const MEAL_PLAN: MealDay[] = RAW_PLAN.map((day, dayIndex) => ({
  index: dayIndex,
  title: day.title,
  meals: day.meals.map<Meal>((meal) => ({
    slot: meal.slot,
    title: meal.title,
    swaps: meal.swaps,
    items: meal.items.map((item, position) =>
      buildItem(dayIndex, meal.slot, position, item),
    ),
  })),
}));

/** Compute calories and macros for a single meal item. */
export function computeItem(item: MealItem): ComputedMealItem {
  const food = getFood(item.foodId);
  const m = macrosForPortion(food, item.grams);
  return {
    ...item,
    name: food.name,
    kcal: m.kcal,
    proteinG: m.proteinG,
    carbsG: m.carbsG,
    fatG: m.fatG,
  };
}

function emptyTotals(): PortionMacros {
  return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

function addInto(acc: PortionMacros, m: PortionMacros): void {
  acc.kcal += m.kcal;
  acc.proteinG += m.proteinG;
  acc.carbsG += m.carbsG;
  acc.fatG += m.fatG;
}

/** Sum calories and macros for a meal. */
export function mealTotals(meal: Meal): PortionMacros {
  const acc = emptyTotals();
  for (const item of meal.items) addInto(acc, computeItem(item));
  return acc;
}

/** Sum calories and macros for a whole day. */
export function dayTotals(day: MealDay): PortionMacros {
  const acc = emptyTotals();
  for (const meal of day.meals) addInto(acc, mealTotals(meal));
  return acc;
}

/** Every meal-item id in the plan (used for completion bookkeeping/export). */
export function allMealItemIds(): string[] {
  return MEAL_PLAN.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.id)));
}

/** The meal-item ids for one day of the plan. */
export function mealItemIdsForDay(dayIndex: number): string[] {
  const day = MEAL_PLAN[dayIndex];
  if (!day) return [];
  return day.meals.flatMap((m) => m.items.map((i) => i.id));
}
