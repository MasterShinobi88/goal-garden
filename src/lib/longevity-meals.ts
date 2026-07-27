/**
 * Longevity / anti-aging meal guidance.
 * Educational lifestyle patterns only — not medical advice or prescriptions.
 */
import {
  buildDietMealPlan,
  type DietMealPlan,
  type MacroTargets,
} from "./health";

export type LongevityMealGuide = {
  label: string;
  summary: string;
  principles: string[];
  weekly_focus: string[];
  sample_day: DietMealPlan;
  grocery_staples: string[];
  disclaimer: string;
};

/** Default macros if user has no weight-loss plan — rough adult template */
export function defaultLongevityMacros(
  calories = 2000
): MacroTargets {
  const protein_g = 130;
  const fat_g = Math.round((calories * 0.32) / 9);
  const carbs_g = Math.max(
    90,
    Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
  );
  return { calories, protein_g, carbs_g, fat_g };
}

export function buildLongevityMealGuide(
  macros?: MacroTargets | null
): LongevityMealGuide {
  const m = macros ?? defaultLongevityMacros();
  const sample_day = buildDietMealPlan("longevity", m);

  return {
    label: "Longevity / anti-aging meals",
    summary:
      "Mediterranean-style pattern: protein each meal, plants, olive oil, berries, legumes, and oily fish — built for healthspan habits, not crash diets.",
    principles: [
      "Protein at every meal to support muscle (key for aging well)",
      "½ plate colorful vegetables often",
      "Olive oil as the main cooking fat",
      "Oily fish (salmon, sardines) 2–3× per week",
      "Berries, nuts, legumes, fermented foods regularly",
      "Limit ultra-processed snacks and sugar-sweetened drinks",
      "Finish large meals earlier when you can; protect sleep",
    ],
    weekly_focus: [
      "Mon: Legume + olive oil lunch (beans/lentils)",
      "Tue: Fatty fish dinner + greens",
      "Wed: Lean poultry or tofu + big salad",
      "Thu: Eggs or Greek yogurt breakfast protein",
      "Fri: Fish or plants (or Friday fish if you observe it)",
      "Sat: Flexible social meal — return to pattern next meal",
      "Sun: Prep protein + chopped veg for 2–3 days",
    ],
    sample_day,
    grocery_staples: [
      "Eggs, Greek yogurt, cottage cheese",
      "Salmon, sardines, chicken/turkey, tofu/tempeh",
      "Olive oil, avocado, mixed nuts",
      "Leafy greens, broccoli, tomatoes, peppers",
      "Berries, apples, citrus",
      "Lentils, chickpeas, black beans",
      "Oats, quinoa, brown rice, potatoes",
      "Garlic, herbs, green tea, dark chocolate (70%+)",
    ],
    disclaimer:
      "Educational guidance only. Not medical advice, diagnosis, or a prescription. Consult a clinician before major diet changes, especially with conditions or medications.",
  };
}
