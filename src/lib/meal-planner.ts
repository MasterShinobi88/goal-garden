/**
 * Weekly meal planner aimed at daily macro targets + shopping list.
 * Guidance only — not medical advice.
 */
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import type { DietStyle, MacroTargets } from "./health";
import {
  findFoodById,
  scaleFood,
  sumMacros,
  unitLabel,
  type FoodItem,
  type MacroTotals,
  type ShoppingCategory,
  SHOPPING_CATEGORY_LABELS,
  SHOPPING_CATEGORY_ORDER,
} from "./food-db";
import { uid } from "./utils";

export type MealSlotName = "breakfast" | "lunch" | "dinner" | "snack";

export type PlannedFood = {
  foodId: string;
  name: string;
  amount: number;
  unit: string;
  macros: MacroTotals;
};

export type PlannedMeal = {
  slot: MealSlotName;
  label: string;
  foods: PlannedFood[];
  macros: MacroTotals;
};

export type PlannedDay = {
  date: string;
  weekday: string;
  meals: PlannedMeal[];
  totals: MacroTotals;
  /** How close to targets (0–100-ish score) */
  hitScore: number;
};

export type ShoppingListItem = {
  id: string;
  foodId: string;
  name: string;
  amount: number;
  unit: string;
  category: ShoppingCategory;
  /** Display-friendly quantity (e.g. "1.2 kg" or "14 eggs") */
  displayAmount: string;
  checked: boolean;
};

export type WeeklyMealPlan = {
  id: string;
  weekStart: string;
  diet_style: DietStyle;
  targets: MacroTargets;
  days: PlannedDay[];
  shopping: ShoppingListItem[];
  created_at: string;
};

const STORAGE_KEY = "goal-garden:meal-plan";

const SLOT_LABELS: Record<MealSlotName, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

/** Fraction of daily kcal per slot */
const SLOT_FRAC: Record<MealSlotName, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

type Ingredient = { foodId: string; baseAmount: number };

/** Meal templates per diet — amounts are starting points, scaled to macros */
type MealTemplate = {
  slot: MealSlotName;
  ingredients: Ingredient[];
};

function food(id: string): FoodItem | undefined {
  return findFoodById(id);
}

function templatesForDiet(diet: DietStyle): MealTemplate[][] {
  // Each inner array is one "day variant" (we cycle 7)
  const balanced: MealTemplate[][] = [
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 2 },
          { foodId: "bread-slice", baseAmount: 2 },
          { foodId: "spinach", baseAmount: 50 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "chicken-breast", baseAmount: 150 },
          { foodId: "rice-white", baseAmount: 180 },
          { foodId: "broccoli", baseAmount: 150 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "salmon", baseAmount: 140 },
          { foodId: "potato", baseAmount: 200 },
          { foodId: "mixed-salad", baseAmount: 120 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "greek-yogurt", baseAmount: 170 },
          { foodId: "blueberry", baseAmount: 80 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "oats", baseAmount: 50 },
          { foodId: "milk-skim", baseAmount: 200 },
          { foodId: "banana", baseAmount: 1 },
          { foodId: "whey", baseAmount: 25 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "turkey", baseAmount: 140 },
          { foodId: "quinoa", baseAmount: 180 },
          { foodId: "bell-pepper", baseAmount: 100 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "ground-beef-90", baseAmount: 140 },
          { foodId: "pasta", baseAmount: 180 },
          { foodId: "tomato", baseAmount: 100 },
          { foodId: "spinach", baseAmount: 80 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "cottage-cheese", baseAmount: 150 },
          { foodId: "apple", baseAmount: 1 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "greek-yogurt", baseAmount: 200 },
          { foodId: "oats", baseAmount: 40 },
          { foodId: "strawberry", baseAmount: 100 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "tuna-can", baseAmount: 150 },
          { foodId: "rice-brown", baseAmount: 180 },
          { foodId: "cucumber", baseAmount: 100 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "chicken-thigh", baseAmount: 160 },
          { foodId: "sweet-potato", baseAmount: 200 },
          { foodId: "broccoli", baseAmount: 150 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "peanut-butter", baseAmount: 1 },
          { foodId: "apple", baseAmount: 1 },
        ],
      },
    ],
  ];

  const vegan: MealTemplate[][] = [
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "oats", baseAmount: 55 },
          { foodId: "soy-milk", baseAmount: 250 },
          { foodId: "banana", baseAmount: 1 },
          { foodId: "pea-protein", baseAmount: 25 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "tofu", baseAmount: 180 },
          { foodId: "rice-brown", baseAmount: 200 },
          { foodId: "broccoli", baseAmount: 150 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "lentils", baseAmount: 220 },
          { foodId: "quinoa", baseAmount: 180 },
          { foodId: "spinach", baseAmount: 100 },
          { foodId: "avocado", baseAmount: 60 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "almonds", baseAmount: 25 },
          { foodId: "apple", baseAmount: 1 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "tofu", baseAmount: 120 },
          { foodId: "bread-slice", baseAmount: 2 },
          { foodId: "spinach", baseAmount: 60 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "chickpeas", baseAmount: 200 },
          { foodId: "quinoa", baseAmount: 180 },
          { foodId: "bell-pepper", baseAmount: 100 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "tempeh", baseAmount: 150 },
          { foodId: "sweet-potato", baseAmount: 220 },
          { foodId: "mixed-salad", baseAmount: 120 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "peanut-butter", baseAmount: 1.5 },
          { foodId: "banana", baseAmount: 1 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "oats", baseAmount: 50 },
          { foodId: "soy-milk", baseAmount: 220 },
          { foodId: "blueberry", baseAmount: 80 },
          { foodId: "peanut-butter", baseAmount: 1 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "beans-black", baseAmount: 200 },
          { foodId: "rice-white", baseAmount: 200 },
          { foodId: "tomato", baseAmount: 100 },
          { foodId: "avocado", baseAmount: 70 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "tofu", baseAmount: 200 },
          { foodId: "pasta", baseAmount: 200 },
          { foodId: "zucchini", baseAmount: 150 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "pea-protein", baseAmount: 30 },
          { foodId: "soy-milk", baseAmount: 250 },
        ],
      },
    ],
  ];

  const vegetarian: MealTemplate[][] = [
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 2 },
          { foodId: "greek-yogurt", baseAmount: 150 },
          { foodId: "berries-mixed", baseAmount: 80 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "cottage-cheese", baseAmount: 180 },
          { foodId: "bread-slice", baseAmount: 2 },
          { foodId: "tomato", baseAmount: 100 },
          { foodId: "cucumber", baseAmount: 80 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "lentils", baseAmount: 200 },
          { foodId: "rice-brown", baseAmount: 180 },
          { foodId: "broccoli", baseAmount: 150 },
          { foodId: "cheddar", baseAmount: 30 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "greek-yogurt", baseAmount: 150 },
          { foodId: "honey", baseAmount: 1 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "oats", baseAmount: 50 },
          { foodId: "milk-skim", baseAmount: 200 },
          { foodId: "banana", baseAmount: 1 },
          { foodId: "whey", baseAmount: 20 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "egg", baseAmount: 3 },
          { foodId: "potato", baseAmount: 200 },
          { foodId: "spinach", baseAmount: 80 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "chickpeas", baseAmount: 200 },
          { foodId: "quinoa", baseAmount: 180 },
          { foodId: "mixed-salad", baseAmount: 120 },
          { foodId: "cheddar", baseAmount: 25 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "cottage-cheese", baseAmount: 150 },
          { foodId: "apple", baseAmount: 1 },
        ],
      },
    ],
  ];

  const keto: MealTemplate[][] = [
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 3 },
          { foodId: "spinach", baseAmount: 80 },
          { foodId: "cheddar", baseAmount: 30 },
          { foodId: "butter", baseAmount: 10 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "chicken-thigh", baseAmount: 180 },
          { foodId: "avocado", baseAmount: 80 },
          { foodId: "mixed-salad", baseAmount: 150 },
          { foodId: "olive-oil", baseAmount: 1.5 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "salmon", baseAmount: 180 },
          { foodId: "broccoli", baseAmount: 150 },
          { foodId: "butter", baseAmount: 12 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "cheddar", baseAmount: 30 },
          { foodId: "almonds", baseAmount: 20 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 2 },
          { foodId: "bacon", baseAmount: 40 },
          { foodId: "avocado", baseAmount: 60 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "ground-beef-90", baseAmount: 160 },
          { foodId: "cauli-rice", baseAmount: 200 },
          { foodId: "zucchini", baseAmount: 150 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "steak", baseAmount: 160 },
          { foodId: "broccoli", baseAmount: 150 },
          { foodId: "butter", baseAmount: 15 },
        ],
      },
      {
        slot: "snack",
        ingredients: [{ foodId: "macadamia", baseAmount: 25 }],
      },
    ],
  ];

  const paleo: MealTemplate[][] = [
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 3 },
          { foodId: "sweet-potato", baseAmount: 150 },
          { foodId: "spinach", baseAmount: 60 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "chicken-breast", baseAmount: 160 },
          { foodId: "mixed-salad", baseAmount: 150 },
          { foodId: "avocado", baseAmount: 70 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "salmon", baseAmount: 160 },
          { foodId: "broccoli", baseAmount: 150 },
          { foodId: "sweet-potato", baseAmount: 180 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "almonds", baseAmount: 25 },
          { foodId: "apple", baseAmount: 1 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 2 },
          { foodId: "turkey", baseAmount: 80 },
          { foodId: "berries-mixed", baseAmount: 100 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "ground-beef-90", baseAmount: 150 },
          { foodId: "zucchini", baseAmount: 150 },
          { foodId: "carrot", baseAmount: 80 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "cod", baseAmount: 180 },
          { foodId: "potato", baseAmount: 200 },
          { foodId: "broccoli", baseAmount: 150 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "banana", baseAmount: 1 },
          { foodId: "almonds", baseAmount: 20 },
        ],
      },
    ],
  ];

  const carnivore: MealTemplate[][] = [
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 3 },
          { foodId: "bacon", baseAmount: 50 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [{ foodId: "ground-beef-90", baseAmount: 220 }],
      },
      {
        slot: "dinner",
        ingredients: [{ foodId: "steak", baseAmount: 220 }],
      },
      {
        slot: "snack",
        ingredients: [{ foodId: "egg", baseAmount: 2 }],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 4 },
          { foodId: "butter", baseAmount: 10 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [{ foodId: "chicken-thigh", baseAmount: 250 }],
      },
      {
        slot: "dinner",
        ingredients: [{ foodId: "salmon", baseAmount: 220 }],
      },
      {
        slot: "snack",
        ingredients: [{ foodId: "cheddar", baseAmount: 40 }],
      },
    ],
  ];

  const pescatarian: MealTemplate[][] = [
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "greek-yogurt", baseAmount: 200 },
          { foodId: "blueberry", baseAmount: 80 },
          { foodId: "oats", baseAmount: 40 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "tuna-can", baseAmount: 150 },
          { foodId: "rice-white", baseAmount: 180 },
          { foodId: "mixed-salad", baseAmount: 120 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "salmon", baseAmount: 160 },
          { foodId: "potato", baseAmount: 200 },
          { foodId: "broccoli", baseAmount: 150 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "cottage-cheese", baseAmount: 150 },
          { foodId: "apple", baseAmount: 1 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 2 },
          { foodId: "bread-slice", baseAmount: 2 },
          { foodId: "avocado", baseAmount: 50 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "shrimp", baseAmount: 160 },
          { foodId: "quinoa", baseAmount: 180 },
          { foodId: "bell-pepper", baseAmount: 100 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "cod", baseAmount: 180 },
          { foodId: "rice-brown", baseAmount: 180 },
          { foodId: "zucchini", baseAmount: 150 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "greek-yogurt", baseAmount: 170 },
          { foodId: "honey", baseAmount: 1 },
        ],
      },
    ],
  ];

  // Mediterranean / longevity-leaning days (protein + plants + olive oil + berries)
  const longevity: MealTemplate[][] = [
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "greek-yogurt", baseAmount: 200 },
          { foodId: "blueberry", baseAmount: 100 },
          { foodId: "walnuts", baseAmount: 20 },
          { foodId: "oats", baseAmount: 30 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "salmon", baseAmount: 150 },
          { foodId: "mixed-salad", baseAmount: 150 },
          { foodId: "quinoa", baseAmount: 160 },
          { foodId: "olive-oil", baseAmount: 1.5 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "chicken-breast", baseAmount: 150 },
          { foodId: "broccoli", baseAmount: 150 },
          { foodId: "lentils", baseAmount: 120 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "almonds", baseAmount: 20 },
          { foodId: "apple", baseAmount: 1 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "egg", baseAmount: 2 },
          { foodId: "spinach", baseAmount: 80 },
          { foodId: "avocado", baseAmount: 50 },
          { foodId: "bread-slice", baseAmount: 1 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "sardines", baseAmount: 100 },
          { foodId: "mixed-salad", baseAmount: 150 },
          { foodId: "chickpeas", baseAmount: 120 },
          { foodId: "olive-oil", baseAmount: 1 },
          { foodId: "tomato", baseAmount: 100 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "turkey", baseAmount: 150 },
          { foodId: "sweet-potato", baseAmount: 180 },
          { foodId: "zucchini", baseAmount: 150 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "cottage-cheese", baseAmount: 150 },
          { foodId: "strawberry", baseAmount: 80 },
        ],
      },
    ],
    [
      {
        slot: "breakfast",
        ingredients: [
          { foodId: "oats", baseAmount: 45 },
          { foodId: "milk-skim", baseAmount: 200 },
          { foodId: "blueberry", baseAmount: 80 },
          { foodId: "chia", baseAmount: 15 },
        ],
      },
      {
        slot: "lunch",
        ingredients: [
          { foodId: "tofu", baseAmount: 180 },
          { foodId: "rice-brown", baseAmount: 180 },
          { foodId: "broccoli", baseAmount: 150 },
          { foodId: "olive-oil", baseAmount: 1 },
        ],
      },
      {
        slot: "dinner",
        ingredients: [
          { foodId: "cod", baseAmount: 170 },
          { foodId: "beans-black", baseAmount: 140 },
          { foodId: "mixed-salad", baseAmount: 140 },
          { foodId: "olive-oil", baseAmount: 1.5 },
        ],
      },
      {
        slot: "snack",
        ingredients: [
          { foodId: "dark-chocolate", baseAmount: 15 },
          { foodId: "walnuts", baseAmount: 15 },
        ],
      },
    ],
  ];

  switch (diet) {
    case "vegan":
      return vegan;
    case "vegetarian":
      return vegetarian.map(stripMissing);
    case "keto":
      return keto;
    case "paleo":
      return paleo;
    case "carnivore":
      return carnivore;
    case "pescatarian":
      return pescatarian;
    case "longevity":
      return longevity.map(stripMissing);
    default:
      return balanced;
  }
}

function stripMissing(day: MealTemplate[]): MealTemplate[] {
  return day.map((m) => ({
    ...m,
    ingredients: m.ingredients.filter((i) => food(i.foodId)),
  }));
}

function mealMacros(ingredients: { foodId: string; amount: number }[]): MacroTotals {
  const parts: MacroTotals[] = [];
  for (const ing of ingredients) {
    const f = food(ing.foodId);
    if (!f || ing.amount <= 0) continue;
    parts.push(scaleFood(f, ing.amount));
  }
  return sumMacros(parts);
}

/**
 * Scale a meal's ingredients toward the slot's share of daily macros.
 * Prioritize protein, then kcal, with soft caps.
 */
function scaleMealToTargets(
  ingredients: Ingredient[],
  slotTargets: MacroTargets
): PlannedFood[] {
  const valid = ingredients.filter((i) => food(i.foodId) && i.baseAmount > 0);
  if (!valid.length) return [];

  // Start with base amounts
  let amounts = valid.map((i) => i.baseAmount);
  let macros = mealMacros(
    valid.map((i, idx) => ({ foodId: i.foodId, amount: amounts[idx] }))
  );

  // Scale overall for calories (within 0.55–1.65)
  if (macros.kcal > 0 && slotTargets.calories > 0) {
    let factor = slotTargets.calories / macros.kcal;
    factor = Math.min(1.65, Math.max(0.55, factor));
    amounts = amounts.map((a) => Math.round(a * factor * 10) / 10);
    macros = mealMacros(
      valid.map((i, idx) => ({ foodId: i.foodId, amount: amounts[idx] }))
    );
  }

  // Boost protein-dense items if under protein target
  if (macros.protein_g < slotTargets.protein_g * 0.85) {
    const proteinIdx = valid
      .map((i, idx) => {
        const f = food(i.foodId)!;
        const density = f.protein_g / Math.max(1, f.kcal);
        return { idx, density };
      })
      .sort((a, b) => b.density - a.density);

    for (const { idx } of proteinIdx.slice(0, 2)) {
      const f = food(valid[idx].foodId)!;
      const need = slotTargets.protein_g - macros.protein_g;
      if (need <= 0) break;
      const protPerUnit = f.protein_g / f.servingSize;
      if (protPerUnit <= 0) continue;
      const add = Math.min(
        need / protPerUnit,
        f.unit === "each" || f.unit === "slice" ? 2 : f.servingSize * 1.2
      );
      amounts[idx] = Math.round((amounts[idx] + add) * 10) / 10;
      macros = mealMacros(
        valid.map((i, j) => ({ foodId: i.foodId, amount: amounts[j] }))
      );
    }
  }

  // Round piece foods to nice numbers
  return valid.map((i, idx) => {
    const f = food(i.foodId)!;
    let amount = amounts[idx];
    if (f.unit === "each" || f.unit === "slice") {
      amount = Math.max(1, Math.round(amount));
    } else if (f.unit === "tbsp" || f.unit === "tsp") {
      amount = Math.round(amount * 2) / 2;
    } else {
      amount = Math.round(amount / 5) * 5;
      if (amount < 5) amount = Math.round(amounts[idx]);
    }
    const m = scaleFood(f, amount);
    return {
      foodId: f.id,
      name: f.name,
      amount,
      unit: unitLabel(f.unit),
      macros: m,
    };
  });
}

function hitScore(totals: MacroTotals, targets: MacroTargets): number {
  if (!targets.calories) return 0;
  const kcalDiff = Math.abs(totals.kcal - targets.calories) / targets.calories;
  const pDiff =
    targets.protein_g > 0
      ? Math.abs(totals.protein_g - targets.protein_g) / targets.protein_g
      : 0;
  const cDiff =
    targets.carbs_g > 0
      ? Math.abs(totals.carbs_g - targets.carbs_g) / targets.carbs_g
      : 0;
  const fDiff =
    targets.fat_g > 0
      ? Math.abs(totals.fat_g - targets.fat_g) / targets.fat_g
      : 0;
  // Weight kcal + protein more
  const err = kcalDiff * 0.4 + pDiff * 0.35 + cDiff * 0.15 + fDiff * 0.1;
  return Math.round(Math.max(0, Math.min(100, (1 - err) * 100)));
}

function formatShopAmount(amount: number, unit: string, foodItem: FoodItem): string {
  if (foodItem.unit === "each" || foodItem.unit === "slice") {
    return `${Math.ceil(amount)} ${unit}`;
  }
  if (foodItem.unit === "g") {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)} kg`;
    return `${Math.ceil(amount)} g`;
  }
  if (foodItem.unit === "ml") {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)} L`;
    return `${Math.ceil(amount)} ml`;
  }
  if (foodItem.unit === "tbsp" || foodItem.unit === "tsp") {
    return `${Math.ceil(amount)} ${unit}`;
  }
  return `${Math.round(amount * 10) / 10} ${unit}`;
}

export function buildShoppingList(days: PlannedDay[]): ShoppingListItem[] {
  const map = new Map<
    string,
    { amount: number; food: FoodItem; name: string }
  >();

  for (const day of days) {
    for (const meal of day.meals) {
      for (const item of meal.foods) {
        const f = food(item.foodId);
        if (!f) continue;
        // Shopping uses raw / slightly padded amounts for cooked foods
        const pad =
          f.unit === "g" &&
          (f.category === "protein" || f.id.includes("rice") || f.id.includes("pasta"))
            ? 1.15
            : 1;
        const prev = map.get(item.foodId);
        if (prev) {
          prev.amount += item.amount * pad;
        } else {
          map.set(item.foodId, {
            amount: item.amount * pad,
            food: f,
            name: f.name.replace(/\s*\(cooked\)/i, "").replace(/\s*\(baked\)/i, "").replace(/\s*\(boiled\)/i, ""),
          });
        }
      }
    }
  }

  const items: ShoppingListItem[] = [];
  for (const [foodId, row] of map) {
    const unit = unitLabel(row.food.unit);
    items.push({
      id: uid(),
      foodId,
      name: row.name,
      amount: Math.round(row.amount * 10) / 10,
      unit,
      category: row.food.category || "other",
      displayAmount: formatShopAmount(row.amount, unit, row.food),
      checked: false,
    });
  }

  items.sort((a, b) => {
    const ca = SHOPPING_CATEGORY_ORDER.indexOf(a.category);
    const cb = SHOPPING_CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name);
  });

  return items;
}

export function generateWeeklyMealPlan(opts: {
  targets: MacroTargets;
  diet_style?: DietStyle;
  weekStart?: string; // ISO Monday-preferred
  friday_fish_only?: boolean;
}): WeeklyMealPlan {
  const diet = opts.diet_style || "balanced";
  const targets = opts.targets;
  const start = opts.weekStart
    ? parseISO(opts.weekStart)
    : startOfWeek(new Date(), { weekStartsOn: 1 });
  start.setHours(12, 0, 0, 0);

  const variants = templatesForDiet(diet);
  const days: PlannedDay[] = [];

  for (let d = 0; d < 7; d++) {
    const date = addDays(start, d);
    const iso = format(date, "yyyy-MM-dd");
    const weekday = format(date, "EEEE");
    let dayTemplates = variants[d % variants.length].map((t) => ({
      ...t,
      ingredients: t.ingredients.filter((i) => food(i.foodId)),
    }));

    // Friday fish swap for land meat
    if (opts.friday_fish_only && date.getDay() === 5) {
      dayTemplates = dayTemplates.map((t) => ({
        ...t,
        ingredients: t.ingredients.map((i) => {
          const landMeat = [
            "chicken-breast",
            "chicken-thigh",
            "ground-beef-90",
            "turkey",
            "pork-chop",
            "steak",
            "bacon",
          ];
          if (landMeat.includes(i.foodId)) {
            return { ...i, foodId: "salmon" };
          }
          return i;
        }),
      }));
    }

    const meals: PlannedMeal[] = dayTemplates.map((t) => {
      const slotCal = Math.round(targets.calories * SLOT_FRAC[t.slot]);
      const slotTargets: MacroTargets = {
        calories: slotCal,
        protein_g: Math.round(targets.protein_g * SLOT_FRAC[t.slot]),
        carbs_g: Math.round(targets.carbs_g * SLOT_FRAC[t.slot]),
        fat_g: Math.round(targets.fat_g * SLOT_FRAC[t.slot]),
      };
      const foods = scaleMealToTargets(t.ingredients, slotTargets);
      return {
        slot: t.slot,
        label: SLOT_LABELS[t.slot],
        foods,
        macros: sumMacros(foods.map((f) => f.macros)),
      };
    });

    const totals = sumMacros(meals.map((m) => m.macros));
    days.push({
      date: iso,
      weekday,
      meals,
      totals,
      hitScore: hitScore(totals, targets),
    });
  }

  return {
    id: uid(),
    weekStart: format(start, "yyyy-MM-dd"),
    diet_style: diet,
    targets,
    days,
    shopping: buildShoppingList(days),
    created_at: new Date().toISOString(),
  };
}

export function loadMealPlan(): WeeklyMealPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeeklyMealPlan;
  } catch {
    return null;
  }
}

export function saveMealPlan(plan: WeeklyMealPlan | null) {
  if (typeof window === "undefined") return;
  if (!plan) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  window.dispatchEvent(new CustomEvent("goal-garden:meal-plan"));
}

export function toggleShoppingItem(
  plan: WeeklyMealPlan,
  itemId: string
): WeeklyMealPlan {
  return {
    ...plan,
    shopping: plan.shopping.map((s) =>
      s.id === itemId ? { ...s, checked: !s.checked } : s
    ),
  };
}

export function clearShoppingChecks(plan: WeeklyMealPlan): WeeklyMealPlan {
  return {
    ...plan,
    shopping: plan.shopping.map((s) => ({ ...s, checked: false })),
  };
}

export function shoppingByCategory(
  shopping: ShoppingListItem[]
): { category: ShoppingCategory; label: string; items: ShoppingListItem[] }[] {
  return SHOPPING_CATEGORY_ORDER.map((category) => ({
    category,
    label: SHOPPING_CATEGORY_LABELS[category],
    items: shopping.filter((s) => s.category === category),
  })).filter((g) => g.items.length > 0);
}

export function exportShoppingText(plan: WeeklyMealPlan): string {
  const lines = [
    `Weekly shopping list · week of ${plan.weekStart}`,
    `Diet: ${plan.diet_style} · targets ~${plan.targets.calories} kcal · P${plan.targets.protein_g} C${plan.targets.carbs_g} F${plan.targets.fat_g}`,
    "",
  ];
  for (const group of shoppingByCategory(plan.shopping)) {
    lines.push(`## ${group.label}`);
    for (const item of group.items) {
      lines.push(
        `${item.checked ? "[x]" : "[ ]"} ${item.displayAmount} ${item.name}`
      );
    }
    lines.push("");
  }
  lines.push("Estimates only — not medical advice.");
  return lines.join("\n");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Printable shopping list HTML (open in new tab → print / Save as PDF).
 * @param hideChecked - if true, only remaining (unchecked) items print
 */
export function buildShoppingListPrintHtml(
  plan: WeeklyMealPlan,
  opts?: { hideChecked?: boolean; title?: string }
): string {
  const hideChecked = opts?.hideChecked ?? false;
  const items = hideChecked
    ? plan.shopping.filter((s) => !s.checked)
    : plan.shopping;
  const groups = shoppingByCategory(items);
  const dietLabel =
    plan.diet_style.charAt(0).toUpperCase() +
    plan.diet_style.slice(1).replace(/_/g, " ");
  const total = items.length;
  const remaining = plan.shopping.filter((s) => !s.checked).length;

  const groupsHtml = groups
    .map((group) => {
      const rows = group.items
        .map(
          (item) => `
        <tr class="${item.checked && !hideChecked ? "done" : ""}">
          <td class="box">${item.checked && !hideChecked ? "☑" : "☐"}</td>
          <td class="name">${escapeHtml(item.name)}</td>
          <td class="qty">${escapeHtml(item.displayAmount)}</td>
        </tr>`
        )
        .join("");
      return `
      <section class="aisle">
        <h2>${escapeHtml(group.label)}</h2>
        <table>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
    })
    .join("");

  const emptyNote =
    groups.length === 0
      ? `<p class="meta">No items to print${hideChecked ? " — everything is checked off." : "."}</p>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Shopping list · Goal Garden</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #0f172a;
      max-width: 720px;
      margin: 28px auto;
      padding: 0 20px 40px;
      line-height: 1.45;
    }
    .brand {
      color: #059669;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 700;
      margin: 0 0 6px;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }
    .meta { color: #64748b; font-size: 13px; margin: 0 0 4px; }
    .badge {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      margin: 8px 0 16px;
    }
    .aisle {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 18px;
    }
    h2 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #065f46;
      border-bottom: 2px solid #059669;
      padding-bottom: 4px;
      margin: 0 0 8px;
    }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #e2e8f0; }
    tr.done td.name { text-decoration: line-through; color: #94a3b8; }
    td { padding: 7px 4px; vertical-align: middle; font-size: 14px; }
    td.box {
      width: 28px;
      font-size: 16px;
      color: #334155;
      line-height: 1;
    }
    td.name { width: auto; }
    td.qty {
      text-align: right;
      font-weight: 600;
      color: #0f766e;
      white-space: nowrap;
      padding-left: 12px;
    }
    .footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
    }
    .actions {
      margin: 12px 0 20px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .actions button {
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      cursor: pointer;
    }
    .actions button.primary {
      background: #059669;
      border-color: #047857;
      color: #fff;
    }
    @media print {
      body { margin: 0; max-width: none; padding: 12px 16px; }
      .actions { display: none !important; }
      .aisle { break-inside: avoid; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <p class="brand">Goal Garden</p>
  <h1>${escapeHtml(opts?.title || "Weekly shopping list")}</h1>
  <p class="meta">Week of ${escapeHtml(plan.weekStart)} · ${escapeHtml(dietLabel)}</p>
  <p class="meta">Macros target ~${plan.targets.calories} kcal · P${plan.targets.protein_g}g · C${plan.targets.carbs_g}g · F${plan.targets.fat_g}g</p>
  <p class="badge">${hideChecked ? `${total} items left` : `${total} items · ${remaining} unchecked`}</p>
  <div class="actions">
    <button class="primary" type="button" onclick="window.print()">Print / Save as PDF</button>
    <button type="button" onclick="window.close()">Close</button>
  </div>
  ${emptyNote}
  ${groupsHtml}
  <div class="footer">
    Goal Garden · Quantities are planning estimates (small buffer on proteins/grains).
    Not medical advice. Generated ${escapeHtml(new Date().toLocaleString())}.
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
}

export function openPrintShoppingList(
  plan: WeeklyMealPlan,
  opts?: { hideChecked?: boolean; title?: string }
) {
  if (typeof window === "undefined") return;
  const html = buildShoppingListPrintHtml(plan, opts);
  const w = window.open("", "_blank");
  if (!w) {
    alert("Allow pop-ups to print your shopping list (or Save as PDF).");
    return;
  }
  w.document.write(html);
  w.document.close();
}

export function dayMacroDelta(
  totals: MacroTotals,
  targets: MacroTargets
): { kcal: number; protein_g: number; carbs_g: number; fat_g: number } {
  return {
    kcal: totals.kcal - targets.calories,
    protein_g: Math.round((totals.protein_g - targets.protein_g) * 10) / 10,
    carbs_g: Math.round((totals.carbs_g - targets.carbs_g) * 10) / 10,
    fat_g: Math.round((totals.fat_g - targets.fat_g) * 10) / 10,
  };
}
