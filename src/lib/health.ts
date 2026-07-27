/**
 * Healthy weight-loss helpers.
 * Estimates only — not medical advice. Uses Mifflin–St Jeor + moderate deficit.
 */

export type Sex = "female" | "male" | "other";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

/** Common eating patterns for meal recommendations */
export type DietStyle =
  | "balanced"
  | "vegan"
  | "vegetarian"
  | "keto"
  | "paleo"
  | "carnivore"
  | "pescatarian"
  /** Mediterranean-leaning, protein + plants — healthspan oriented (not medical) */
  | "longevity";

export type FastingProtocol =
  | "none"
  | "16_8"
  | "omad"
  | "water_day"
  | "religious";

export type WeightLossProfile = {
  current_weight_kg: number;
  goal_weight_kg: number;
  height_cm: number;
  age: number;
  sex: Sex;
  activity_level: ActivityLevel;
  /** Optional circumference measurements (cm) */
  waist_cm?: number;
  hips_cm?: number;
  chest_cm?: number;
  units?: "metric" | "imperial";
  /** Preferred diet style for meal ideas & macro tilt */
  diet_style?: DietStyle;
  /**
   * Religious / cultural: no land meat on Fridays (fish OK).
   * Common Catholic-style Friday observance.
   */
  friday_fish_only?: boolean;
  /**
   * Days of week for fasting (0=Sun … 6=Sat).
   * Used with fasting_protocol for hour-by-hour or meal-window tasks.
   */
  fasting_days?: number[];
  fasting_protocol?: FastingProtocol;
  /** Generate hour-by-hour schedule tasks on fasting / structured days */
  hour_by_hour_schedule?: boolean;
};

export type MacroTargets = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type MealSlot = {
  time?: string;
  label: string;
  ideas: string;
};

export type DietMealPlan = {
  style: DietStyle;
  label: string;
  summary: string;
  meals: MealSlot[];
  tips: string[];
};

export type WeightLossPlanSummary = {
  bmr: number;
  tdee: number;
  daily_calories: number;
  deficit_per_day: number;
  weekly_loss_kg: number;
  weeks_estimated: number;
  macros: MacroTargets;
  water_liters: number;
  water_glasses: number;
  bmi_current: number;
  bmi_goal: number;
  activity_level: ActivityLevel;
  recommend_home_workouts: boolean;
  home_workouts: string[];
  healthy_notes: string[];
  weekly_weigh_in: boolean;
  disclaimer: string;
  diet_style?: DietStyle;
  meal_plan?: DietMealPlan;
  friday_fish_only?: boolean;
  fasting_days?: number[];
  fasting_protocol?: FastingProtocol;
  hour_by_hour_schedule?: boolean;
};

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Light (walks 1–3 days/week)",
  moderate: "Moderate (exercise 3–5 days/week)",
  active: "Active (hard exercise 6–7 days/week)",
  very_active: "Very active (physical job + training)",
};

export const DIET_STYLE_LABELS: Record<DietStyle, string> = {
  balanced: "Balanced (flex / plate method)",
  vegan: "Vegan (plant-only)",
  vegetarian: "Vegetarian (no meat/fish)",
  keto: "Keto (very low carb)",
  paleo: "Paleo (whole foods)",
  carnivore: "Carnivore (animal foods)",
  pescatarian: "Pescatarian (fish + plants)",
  longevity: "Longevity / anti-aging (Med-style)",
};

export const FASTING_PROTOCOL_LABELS: Record<FastingProtocol, string> = {
  none: "No fasting schedule",
  "16_8": "Intermittent 16:8 (eat in 8-hour window)",
  omad: "OMAD (one meal a day)",
  water_day: "Water / black coffee / tea only on fasting days",
  religious: "Religious / custom (lighter meals, prayer rhythm)",
};

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEIGHT_LOSS_PATTERNS = [
  /weight\s*loss/i,
  /lose\s+weight/i,
  /losing\s+weight/i,
  /shed\s+(lbs?|pounds?|kg|kilos?)/i,
  /drop\s+\d+\s*(lbs?|pounds?|kg)/i,
  /get\s+(slim|lean|fit|toned)/i,
  /fat\s*loss/i,
  /slim\s*down/i,
  /cut\s+body\s*fat/i,
  /body\s*recomp/i,
  /weight\s*management/i,
  /healthier\s*weight/i,
  /lbs?\s*off/i,
  /kg\s*off/i,
  /diet\s*and\s*exercise/i,
  /fitness\s*and\s*nutrition/i,
];

export function isWeightLossGoal(title: string, description = ""): boolean {
  const text = `${title} ${description}`;
  return WEIGHT_LOSS_PATTERNS.some((p) => p.test(text));
}

export function lbsToKg(lbs: number) {
  return lbs * 0.453592;
}

export function kgToLbs(kg: number) {
  return kg / 0.453592;
}

export function inchesToCm(inches: number) {
  return inches * 2.54;
}

export function cmToInches(cm: number) {
  return cm / 2.54;
}

/** Mifflin–St Jeor BMR (kcal/day) */
export function calcBmr(p: WeightLossProfile): number {
  const { current_weight_kg: w, height_cm: h, age, sex } = p;
  // For "other", average of male/female formulas
  const male = 10 * w + 6.25 * h - 5 * age + 5;
  const female = 10 * w + 6.25 * h - 5 * age - 161;
  if (sex === "male") return Math.round(male);
  if (sex === "female") return Math.round(female);
  return Math.round((male + female) / 2);
}

export function calcTdee(p: WeightLossProfile): number {
  return Math.round(calcBmr(p) * ACTIVITY_MULTIPLIER[p.activity_level]);
}

export function calcBmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  if (m <= 0) return 0;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/**
 * Healthy deficit: ~15–20% of TDEE, capped so loss ≈ 0.5–0.75% body weight / week
 * (~0.25–0.75 kg/week typical), never crash diet.
 */
export function buildWeightLossPlan(
  p: WeightLossProfile,
  deadlineISO?: string
): WeightLossPlanSummary {
  const bmr = calcBmr(p);
  const tdee = calcTdee(p);
  const toLose = Math.max(0, p.current_weight_kg - p.goal_weight_kg);

  // Target weekly loss: min(0.75% BW, 0.75 kg), at least 0.25 if there's weight to lose
  const maxWeeklyKg = Math.min(
    0.75,
    Math.max(0.25, p.current_weight_kg * 0.0075)
  );
  const weeksFromDeadline = deadlineISO
    ? Math.max(
        4,
        Math.ceil(
          (new Date(deadlineISO).getTime() - Date.now()) /
            (7 * 24 * 60 * 60 * 1000)
        )
      )
    : Math.ceil(toLose / maxWeeklyKg) || 12;

  let weeklyLossKg =
    toLose > 0 ? Math.min(maxWeeklyKg, toLose / weeksFromDeadline) : 0;
  // If deadline is aggressive, slow them down rather than crash diet
  if (weeklyLossKg > maxWeeklyKg) weeklyLossKg = maxWeeklyKg;

  // ~7700 kcal ≈ 1 kg fat
  let deficit = Math.round(weeklyLossKg * 7700 / 7);
  // Prefer 15–22% TDEE deficit when possible
  const softMaxDeficit = Math.round(tdee * 0.22);
  const softMinDeficit = Math.round(tdee * 0.12);
  if (toLose > 0) {
    deficit = Math.min(softMaxDeficit, Math.max(softMinDeficit, deficit));
  } else {
    deficit = 0;
  }

  // Floor: never below ~1.2× BMR for safety (or absolute floors)
  const absoluteFloor = p.sex === "female" ? 1300 : p.sex === "male" ? 1500 : 1400;
  const safeFloor = Math.max(absoluteFloor, Math.round(bmr * 1.15));
  let dailyCalories = Math.max(safeFloor, tdee - deficit);
  // Recompute actual deficit after floor
  const actualDeficit = Math.max(0, tdee - dailyCalories);
  const actualWeeklyKg = Math.round((actualDeficit * 7) / 7700 * 100) / 100;
  const weeksEstimated =
    actualWeeklyKg > 0
      ? Math.ceil(toLose / actualWeeklyKg)
      : weeksFromDeadline;

  const diet_style: DietStyle = p.diet_style || "balanced";
  const macros = calcMacros(
    dailyCalories,
    p.current_weight_kg,
    p.goal_weight_kg,
    diet_style
  );
  const meal_plan = buildDietMealPlan(diet_style, macros, {
    friday_fish_only: p.friday_fish_only,
  });

  // Water: ~33 ml/kg, min 2 L, +0.3 L if active+
  let waterMl = p.current_weight_kg * 33;
  if (p.activity_level === "active" || p.activity_level === "very_active") {
    waterMl += 300;
  }
  waterMl = Math.max(2000, Math.min(4000, waterMl));
  const water_liters = Math.round(waterMl / 100) / 10;
  const water_glasses = Math.round(waterMl / 250);

  const recommend_home_workouts =
    p.activity_level === "sedentary" || p.activity_level === "light";

  const home_workouts = recommend_home_workouts
    ? [
        "10-minute morning walk (or march in place)",
        "Bodyweight circuit: 2×10 squats, 2×8 push-ups (knee OK), 2×20s plank",
        "15-minute mobility: cat-cow, hip openers, shoulder rolls",
        "Evening stroll after dinner (10–20 min)",
        "Chair sit-to-stands × 12 + wall push-ups × 10",
        "Gentle yoga flow or free YouTube beginner stretch (15 min)",
      ]
    : [
        "Keep current training; add 1 extra walk day if recovery allows",
        "2×/week strength (full body) + 1–2 easy cardio sessions",
        "Optional: short mobility finisher after workouts",
      ];

  const healthy_notes: string[] = [
    "Aim for steady loss (~0.25–0.75 kg / 0.5–1.5 lb per week) — faster is rarely healthier.",
    "Prioritize protein and whole foods; leave room for foods you enjoy.",
    "Sleep 7–9 hours; poor sleep increases hunger and slows recovery.",
    "Weigh in weekly under similar conditions (e.g. morning), not daily stress.",
    "This is educational guidance, not a medical diagnosis or prescription.",
  ];

  if (recommend_home_workouts) {
    healthy_notes.unshift(
      "Your activity level is on the lower side — start with no-equipment home movement before intense gym work."
    );
  }

  if (calcBmi(p.goal_weight_kg, p.height_cm) < 18.5) {
    healthy_notes.unshift(
      "Goal weight may be below a typical healthy BMI range — consider checking with a clinician and setting a gentler target."
    );
  }

  if (toLose > p.current_weight_kg * 0.15) {
    healthy_notes.push(
      "You're aiming for a meaningful change — break it into smaller checkpoints and celebrate non-scale wins."
    );
  }

  if (diet_style === "keto" || diet_style === "carnivore") {
    healthy_notes.push(
      `${DIET_STYLE_LABELS[diet_style]} can be restrictive — monitor energy, electrolytes, and check with a clinician if you have medical conditions.`
    );
  }
  if (diet_style === "vegan" || diet_style === "vegetarian") {
    healthy_notes.push(
      "Plant-forward plans: consider B12 (and iron/iodine as needed) with a clinician or dietitian."
    );
  }
  if (p.friday_fish_only) {
    healthy_notes.push(
      "Friday fish-only mode is on — land meat is swapped for fish or plant proteins on Fridays."
    );
  }
  if (p.fasting_protocol && p.fasting_protocol !== "none" && p.fasting_days?.length) {
    healthy_notes.push(
      `Fasting schedule: ${FASTING_PROTOCOL_LABELS[p.fasting_protocol]} on ${p.fasting_days
        .map((d) => WEEKDAY_LABELS[d] ?? String(d))
        .join(", ")}. Stay hydrated; stop if you feel unwell.`
    );
  }

  return {
    bmr,
    tdee,
    daily_calories: dailyCalories,
    deficit_per_day: actualDeficit,
    weekly_loss_kg: actualWeeklyKg,
    weeks_estimated: weeksEstimated,
    macros,
    water_liters,
    water_glasses,
    bmi_current: calcBmi(p.current_weight_kg, p.height_cm),
    bmi_goal: calcBmi(p.goal_weight_kg, p.height_cm),
    activity_level: p.activity_level,
    recommend_home_workouts,
    home_workouts,
    healthy_notes,
    weekly_weigh_in: true,
    disclaimer:
      "Estimates only. Not medical advice. Consult a doctor before major diet or exercise changes, especially with conditions or medications.",
    diet_style,
    meal_plan,
    friday_fish_only: p.friday_fish_only,
    fasting_days: p.fasting_days,
    fasting_protocol: p.fasting_protocol || "none",
    hour_by_hour_schedule: p.hour_by_hour_schedule,
  };
}

/** Protein-forward macros for fat loss, tilted by diet style */
export function calcMacros(
  calories: number,
  currentWeightKg: number,
  goalWeightKg: number,
  diet: DietStyle = "balanced"
): MacroTargets {
  const leanTarget = Math.min(currentWeightKg, goalWeightKg);

  if (diet === "keto") {
    const protein_g = Math.round(leanTarget * 1.6);
    const carbs_g = 30;
    const fat_g = Math.max(
      40,
      Math.round((calories - protein_g * 4 - carbs_g * 4) / 9)
    );
    return { calories, protein_g, carbs_g, fat_g };
  }

  if (diet === "carnivore") {
    const protein_g = Math.round(leanTarget * 2.0);
    const carbs_g = 5;
    const fat_g = Math.max(
      50,
      Math.round((calories - protein_g * 4 - carbs_g * 4) / 9)
    );
    return { calories, protein_g, carbs_g, fat_g };
  }

  // ~1.6–2.0 g protein per kg of goal (or leaner target) weight
  let proteinMult = 1.8;
  if (diet === "vegan" || diet === "vegetarian") proteinMult = 1.9;
  if (diet === "paleo") proteinMult = 1.85;
  // Longevity: prioritize muscle preservation + plants
  if (diet === "longevity") proteinMult = 1.9;

  const protein_g = Math.round(leanTarget * proteinMult);
  const protein_kcal = protein_g * 4;
  // Fat ~25–30% of calories (slightly higher paleo / olive-oil friendly longevity)
  const fatPct = diet === "paleo" || diet === "longevity" ? 0.32 : 0.28;
  const fat_g = Math.round((calories * fatPct) / 9);
  const fat_kcal = fat_g * 9;
  const minCarbs = diet === "paleo" ? 60 : diet === "longevity" ? 90 : 80;
  const carbs_g = Math.max(
    minCarbs,
    Math.round((calories - protein_kcal - fat_kcal) / 4)
  );
  return {
    calories,
    protein_g,
    carbs_g,
    fat_g,
  };
}

export function formatMacrosLine(m: MacroTargets): string {
  return `~${m.calories} kcal · P ${m.protein_g}g · C ${m.carbs_g}g · F ${m.fat_g}g`;
}

export function validateWeightLossProfile(
  p: Partial<WeightLossProfile>
): string | null {
  if (!p.current_weight_kg || p.current_weight_kg < 30 || p.current_weight_kg > 300) {
    return "Enter a realistic current weight.";
  }
  if (!p.goal_weight_kg || p.goal_weight_kg < 30 || p.goal_weight_kg > 300) {
    return "Enter a realistic goal weight.";
  }
  if (p.goal_weight_kg > p.current_weight_kg) {
    return "For weight loss, goal weight should be below current weight. (Strength/gain goals can use the general planner.)";
  }
  if (!p.height_cm || p.height_cm < 100 || p.height_cm > 250) {
    return "Enter a realistic height.";
  }
  if (!p.age || p.age < 16 || p.age > 100) {
    return "Enter a valid age (16+). Youth should work with a clinician.";
  }
  if (!p.sex) return "Select sex (used only for calorie estimates).";
  if (!p.activity_level) return "Select your activity level.";
  return null;
}

/** Build a diet-specific sample meal plan (guidance only) */
export function buildDietMealPlan(
  style: DietStyle,
  macros: MacroTargets,
  opts?: { friday_fish_only?: boolean }
): DietMealPlan {
  const pMeal = Math.round(macros.protein_g / 3);
  const plans: Record<DietStyle, DietMealPlan> = {
    balanced: {
      style: "balanced",
      label: "Balanced plate",
      summary: "½ veg, ¼ protein, ¼ carbs + healthy fat — flexible and sustainable.",
      meals: [
        {
          time: "7:30",
          label: "Breakfast",
          ideas: `Greek yogurt or eggs + fruit + whole grain (~${pMeal}g protein)`,
        },
        {
          time: "12:30",
          label: "Lunch",
          ideas: "Lean protein (chicken, tofu, fish) + big vegetables + rice or potatoes",
        },
        {
          time: "18:30",
          label: "Dinner",
          ideas: "Plate method — ½ veg, ¼ protein, ¼ carbs + olive oil or avocado",
        },
        {
          label: "Snacks",
          ideas: "Fruit, cottage cheese, hummus + veg, handful of nuts",
        },
      ],
      tips: [
        "Hit protein at every meal",
        "Front-load water before noon",
        "One flexible meal/week is fine",
      ],
    },
    vegan: {
      style: "vegan",
      label: "Vegan",
      summary: "Plant-only meals with legumes, tofu/tempeh, whole grains, and produce.",
      meals: [
        {
          time: "7:30",
          label: "Breakfast",
          ideas: `Tofu scramble + spinach + toast, or oats with soy milk, chia, berries (~${pMeal}g protein)`,
        },
        {
          time: "12:30",
          label: "Lunch",
          ideas: "Lentil or chickpea bowl + quinoa + roasted veg + tahini",
        },
        {
          time: "18:30",
          label: "Dinner",
          ideas: "Tempeh stir-fry or black-bean tacos + big salad + avocado",
        },
        {
          label: "Snacks",
          ideas: "Edamame, roasted chickpeas, peanut butter + apple, protein smoothie (plant powder)",
        },
      ],
      tips: [
        "Combine legumes + grains for complete amino acids",
        "Consider B12 supplementation (ask a clinician)",
        "Include iron-rich foods with vitamin C",
      ],
    },
    vegetarian: {
      style: "vegetarian",
      label: "Vegetarian",
      summary: "No meat or fish — eggs, dairy, legumes, and plants for protein.",
      meals: [
        {
          time: "7:30",
          label: "Breakfast",
          ideas: `Eggs + veg omelette or Greek yogurt parfait with fruit & seeds (~${pMeal}g protein)`,
        },
        {
          time: "12:30",
          label: "Lunch",
          ideas: "Paneer/tofu curry or bean burrito bowl + salad + yogurt",
        },
        {
          time: "18:30",
          label: "Dinner",
          ideas: "Veggie chili with cheese, or lentil pasta + side salad",
        },
        {
          label: "Snacks",
          ideas: "Cottage cheese, string cheese, hummus + veg, trail mix",
        },
      ],
      tips: [
        "Dairy & eggs make protein targets easier",
        "Vary legumes to keep meals interesting",
        "Watch liquid calories in fancy coffee drinks",
      ],
    },
    keto: {
      style: "keto",
      label: "Keto",
      summary: "Very low carb, moderate protein, higher fat — focus on satiety.",
      meals: [
        {
          time: "8:00",
          label: "Breakfast",
          ideas: `Eggs + avocado + spinach cooked in butter/oil (~${pMeal}g protein)`,
        },
        {
          time: "13:00",
          label: "Lunch",
          ideas: "Grilled chicken or salmon salad with olive oil, cheese, olives",
        },
        {
          time: "19:00",
          label: "Dinner",
          ideas: "Steak or fatty fish + non-starchy veg + butter or olive oil",
        },
        {
          label: "Snacks",
          ideas: "Cheese, olives, handful of macadamias, celery + cream cheese",
        },
      ],
      tips: [
        `Keep carbs near ~${macros.carbs_g}g/day`,
        "Electrolytes (sodium, potassium, magnesium) matter",
        "Not ideal for everyone — medical check if needed",
      ],
    },
    paleo: {
      style: "paleo",
      label: "Paleo",
      summary: "Whole foods: meat, fish, eggs, veg, fruit, nuts — skip grains & ultra-processed.",
      meals: [
        {
          time: "7:30",
          label: "Breakfast",
          ideas: `Eggs + sweet potato hash + berries (~${pMeal}g protein)`,
        },
        {
          time: "12:30",
          label: "Lunch",
          ideas: "Grilled chicken or turkey + large salad + olive oil + fruit",
        },
        {
          time: "18:30",
          label: "Dinner",
          ideas: "Fish or lean beef + roasted vegetables + avocado",
        },
        {
          label: "Snacks",
          ideas: "Apple + almond butter, beef jerky (clean), carrot sticks, handful of nuts",
        },
      ],
      tips: [
        "Prioritize unprocessed proteins and produce",
        "Sweet potato / fruit for training carbs",
        "Skip seed oils if that matches your paleo rules",
      ],
    },
    carnivore: {
      style: "carnivore",
      label: "Carnivore",
      summary: "Animal foods focus — meat, fish, eggs, optional dairy. Very low plant matter.",
      meals: [
        {
          time: "8:00",
          label: "Breakfast",
          ideas: `Eggs + bacon or sausage (~${pMeal}g protein)`,
        },
        {
          time: "13:00",
          label: "Lunch",
          ideas: "Ground beef or steak; optional butter or cheese",
        },
        {
          time: "19:00",
          label: "Dinner",
          ideas: "Ribeye, salmon, or chicken thighs — salt to taste",
        },
        {
          label: "Snacks",
          ideas: "Hard-boiled eggs, leftover meat, bone broth",
        },
      ],
      tips: [
        "Salt food well; consider electrolytes",
        "Highly restrictive — monitor how you feel",
        "Discuss long-term use with a clinician",
      ],
    },
    pescatarian: {
      style: "pescatarian",
      label: "Pescatarian",
      summary: "Fish & seafood plus plants — no land meat.",
      meals: [
        {
          time: "7:30",
          label: "Breakfast",
          ideas: `Smoked salmon + eggs or Greek yogurt + fruit (~${pMeal}g protein)`,
        },
        {
          time: "12:30",
          label: "Lunch",
          ideas: "Tuna or sardine salad, or tofu bowl if plant day + veg + grains",
        },
        {
          time: "18:30",
          label: "Dinner",
          ideas: "Baked salmon or white fish + vegetables + rice or potatoes",
        },
        {
          label: "Snacks",
          ideas: "Cottage cheese, edamame, fruit, handful of nuts",
        },
      ],
      tips: [
        "Aim for oily fish 2–3×/week for omega-3s",
        "Rotate white fish and plant proteins",
        "Watch mercury: vary species, limit high-mercury fish",
      ],
    },
    longevity: {
      style: "longevity",
      label: "Longevity / anti-aging",
      summary:
        "Mediterranean-leaning plate: protein at every meal, plants, olive oil, berries, fermented foods. Educational — not medical advice.",
      meals: [
        {
          time: "7:30",
          label: "Breakfast",
          ideas: `Greek yogurt or eggs + berries + walnuts/oats (~${pMeal}g protein) · green tea optional`,
        },
        {
          time: "12:30",
          label: "Lunch",
          ideas:
            "Salmon, sardines, chicken, or legumes + big salad + olive oil + whole grains or potatoes",
        },
        {
          time: "18:30",
          label: "Dinner",
          ideas:
            "Lean protein + ½ plate colorful vegetables + olive oil · beans or lentils often",
        },
        {
          label: "Snacks",
          ideas:
            "Handful of nuts, cottage cheese, fruit, hummus + veg, dark chocolate square (70%+)",
        },
      ],
      tips: [
        "Protein at every meal to support muscle (healthspan)",
        "Oily fish 2–3×/week · olive oil as main fat",
        "Berries, leafy greens, legumes, fermented foods often",
        "Minimize ultra-processed snacks and late heavy meals",
        "Hydrate well; pair with sleep + strength training",
        "Not medical advice — discuss diets/supplements with a clinician",
      ],
    },
  };

  const plan = { ...(plans[style] || plans.balanced) };
  plan.meals = plan.meals.map((m) => ({ ...m }));
  plan.tips = [...plan.tips];

  if (opts?.friday_fish_only) {
    plan.tips = [
      "Fridays: no land meat — fish, seafood, or plant proteins only",
      ...plan.tips,
    ];
  }

  return plan;
}

/** Meal idea strings for cards / task notes (diet-aware) */
export function sampleMealIdeas(
  macros: MacroTargets,
  style: DietStyle = "balanced",
  opts?: { friday_fish_only?: boolean }
): string[] {
  const plan = buildDietMealPlan(style, macros, opts);
  const lines = plan.meals.map((m) =>
    m.time ? `${m.label} (~${m.time}): ${m.ideas}` : `${m.label}: ${m.ideas}`
  );
  lines.push(...plan.tips.slice(0, 2).map((t) => `Tip: ${t}`));
  return lines;
}

/** Friday fish swap note for land-meat diets */
export function fridayFishMealIdeas(macros: MacroTargets): string[] {
  const p = Math.round(macros.protein_g / 3);
  return [
    `Friday breakfast: eggs + fruit or yogurt (~${p}g protein) — no bacon/sausage if avoiding meat`,
    "Friday lunch: tuna salad, sardines, or bean bowl (no chicken/beef)",
    "Friday dinner: baked fish + vegetables + starch of choice",
    "Friday snack: hummus + veg, cheese, or nuts",
  ];
}

/**
 * Hour-by-hour structure for a normal or fasting day.
 * Educational schedule — not medical advice.
 */
export function buildHourByHourDay(opts: {
  fasting: boolean;
  protocol: FastingProtocol;
  diet: DietStyle;
  macros: MacroTargets;
  waterGlasses: number;
  mealPlan: DietMealPlan;
}): { hour: string; title: string; note?: string }[] {
  const { fasting, protocol, macros, waterGlasses, mealPlan } = opts;
  const eatWindow =
    protocol === "16_8"
      ? { start: 12, end: 20 }
      : protocol === "omad"
        ? { start: 18, end: 19 }
        : { start: 7, end: 20 };

  if (!fasting || protocol === "none") {
    const slots = [
      { hour: "07:00", title: "Wake · water (1–2 glasses)", note: "Hydrate before coffee" },
      { hour: "07:30", title: `Breakfast · ~${Math.round(macros.protein_g / 3)}g protein`, note: mealPlan.meals[0]?.ideas },
      { hour: "10:00", title: "Optional snack or tea", note: mealPlan.meals[3]?.ideas },
      { hour: "12:30", title: "Lunch", note: mealPlan.meals[1]?.ideas },
      { hour: "15:30", title: "Movement break 5–10 min", note: "Walk or stretch" },
      { hour: "18:30", title: "Dinner", note: mealPlan.meals[2]?.ideas },
      { hour: "20:30", title: "Wind-down · no heavy snacks", note: `Water goal ~${waterGlasses} glasses by end of day` },
      { hour: "22:00", title: "Sleep window begins", note: "7–9 hours target" },
    ];
    return slots;
  }

  if (protocol === "water_day") {
    return [
      { hour: "07:00", title: "Fasting day · water only (or black coffee/tea)", note: "Not medical advice — stop if unwell" },
      { hour: "09:00", title: "Water + electrolytes if needed", note: "Light walk OK" },
      { hour: "12:00", title: "Midday check-in · rest if dizzy", note: "No solid food on water-day protocol" },
      { hour: "15:00", title: "Gentle movement or rest", note: "Avoid hard training" },
      { hour: "18:00", title: "Hydrate · plan tomorrow’s first meal", note: mealPlan.meals[0]?.ideas },
      { hour: "21:00", title: "Early wind-down", note: "Sleep supports recovery from fast days" },
    ];
  }

  if (protocol === "omad") {
    return [
      { hour: "07:00", title: "Wake · water / black coffee / tea", note: "Fasting window open" },
      { hour: "10:00", title: "Hydrate · light work focus", note: "No calories until meal window" },
      { hour: "14:00", title: "Walk or stretch (optional)", note: "Keep intensity easy" },
      {
        hour: "18:00",
        title: `OMAD meal (~${macros.calories} kcal target)`,
        note: mealPlan.meals.map((m) => m.ideas).join(" · "),
      },
      { hour: "19:30", title: "Eating window closes", note: "Brush teeth · herbal tea OK" },
      { hour: "22:00", title: "Sleep", note: "7–9 hours" },
    ];
  }

  if (protocol === "religious") {
    return [
      { hour: "06:30", title: "Morning intention / prayer · water", note: "Keep your tradition’s rules" },
      { hour: "08:00", title: "Light meal if your tradition allows", note: mealPlan.meals[0]?.ideas },
      { hour: "12:30", title: "Midday meal or continued fast", note: "Follow your faith’s guidance" },
      { hour: "15:00", title: "Quiet rest or short walk", note: "Stay hydrated if allowed" },
      { hour: "18:30", title: "Evening meal / break-fast", note: mealPlan.meals[2]?.ideas },
      { hour: "21:00", title: "Reflection · sleep prep", note: "Gentle close to the day" },
    ];
  }

  // 16:8 default
  return [
    { hour: "07:00", title: "Fasting window · water / black coffee / tea", note: `Eat ${eatWindow.start}:00–${eatWindow.end}:00` },
    { hour: "10:00", title: "Hydrate · work block", note: "No calories until window opens" },
    {
      hour: `${String(eatWindow.start).padStart(2, "0")}:00`,
      title: "Eating window opens · first meal",
      note: mealPlan.meals[0]?.ideas || mealPlan.meals[1]?.ideas,
    },
    {
      hour: "15:00",
      title: "Second meal / snack",
      note: mealPlan.meals[1]?.ideas,
    },
    {
      hour: "18:30",
      title: "Last meal before window closes",
      note: mealPlan.meals[2]?.ideas,
    },
    {
      hour: `${String(eatWindow.end).padStart(2, "0")}:00`,
      title: "Eating window closes",
      note: `Water goal ~${waterGlasses} glasses total`,
    },
    { hour: "22:00", title: "Sleep", note: "7–9 hours" },
  ];
}
