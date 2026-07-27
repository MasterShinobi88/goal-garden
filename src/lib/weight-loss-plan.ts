/**
 * Weight-loss plan generator.
 * Puts a full daily checklist on each day (not one sparse task per day),
 * plus weekly milestones for weigh-ins, prep, and review.
 */
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import type { BusySlot, GeneratedPlan } from "./types";
import {
  buildHourByHourDay,
  buildWeightLossPlan,
  fridayFishMealIdeas,
  formatMacrosLine,
  sampleMealIdeas,
  type DietStyle,
  type WeightLossProfile,
  type WeightLossPlanSummary,
} from "./health";

type PlanTask = {
  title: string;
  scheduled_date: string;
  notes?: string;
};

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isFastingDay(date: Date, summary: WeightLossPlanSummary): boolean {
  if (!summary.fasting_protocol || summary.fasting_protocol === "none") {
    return false;
  }
  const days = summary.fasting_days;
  if (!days?.length) return false;
  return days.includes(date.getDay());
}

/**
 * Daily habit checklist for a single calendar day.
 * Multiple items same day so Today’s wins feels full.
 */
function dailyChecklist(
  date: Date,
  dayIndex: number,
  summary: WeightLossPlanSummary,
  macroLine: string,
  meals: string[]
): PlanTask[] {
  const iso = format(date, "yyyy-MM-dd");
  const weekend = isWeekend(date);
  const home = summary.recommend_home_workouts;
  const diet: DietStyle = summary.diet_style || "balanced";
  const fridayFish =
    Boolean(summary.friday_fish_only) && date.getDay() === 5;
  const fasting = isFastingDay(date, summary);

  // Rotate movement so the week isn’t identical
  const movementPool = home
    ? [
        {
          title: "Move: 10–15 min walk (or march in place)",
          notes: summary.home_workouts[0],
        },
        {
          title: "Move: bodyweight circuit (squats, push-ups, plank)",
          notes: summary.home_workouts[1],
        },
        {
          title: "Move: post-dinner stroll 10–20 min",
          notes: summary.home_workouts[3] || "Gentle pace",
        },
        {
          title: "Move: mobility / stretch 10–15 min",
          notes: summary.home_workouts[2],
        },
        {
          title: "Move: chair sit-to-stands + wall push-ups",
          notes: summary.home_workouts[4] || "2 rounds is enough",
        },
      ]
    : [
        {
          title: "Move: planned training or 20–30 min cardio",
          notes: summary.home_workouts[0],
        },
        {
          title: "Move: strength or full-body session",
          notes: summary.home_workouts[1],
        },
        {
          title: "Move: easy recovery walk 15–25 min",
          notes: "Keep it conversational pace",
        },
        {
          title: "Move: mobility finisher after work",
          notes: summary.home_workouts[2],
        },
      ];

  // Weekends / fasting: slightly softer movement default
  const movement =
    (weekend || fasting) && home
      ? movementPool[2] // stroll
      : movementPool[dayIndex % movementPool.length];

  const dayMeals = fridayFish
    ? fridayFishMealIdeas(summary.macros)
    : meals;

  const nutritionFocus = fasting
    ? [
        {
          title: `Fasting day: follow ${summary.fasting_protocol} protocol`,
          notes:
            "Stay hydrated · stop if you feel unwell · not medical advice",
        },
        {
          title: "Fasting day: electrolytes / black coffee or tea only if allowed",
          notes: macroLine + " · resume normal meals tomorrow",
        },
      ]
    : fridayFish
      ? [
          {
            title: "Friday: fish or plant protein only (no land meat)",
            notes: dayMeals[2] || dayMeals[1] || "Fish + veg + starch",
          },
          {
            title: `Nutrition: ~${summary.daily_calories} kcal · Friday fish mode`,
            notes: dayMeals[0] || macroLine,
          },
        ]
      : [
          {
            title: `Nutrition: stay near ~${summary.daily_calories} kcal (${diet})`,
            notes: macroLine + " · " + (dayMeals[0] || ""),
          },
          {
            title: `Nutrition: hit ~${summary.macros.protein_g}g protein`,
            notes: "Spread across meals · " + (dayMeals[0] || ""),
          },
          {
            title:
              diet === "keto" || diet === "carnivore"
                ? "Nutrition: stay low-carb / on-plan foods"
                : "Nutrition: half-plate vegetables at lunch or dinner",
            notes: dayMeals[2] || "Produce first, then protein",
          },
          {
            title: "Nutrition: protein at every meal",
            notes: dayMeals[1] || macroLine,
          },
        ];
  const nutrition = nutritionFocus[dayIndex % nutritionFocus.length];

  const checklist: PlanTask[] = [
    {
      title: `Water: ${summary.water_liters} L (~${summary.water_glasses} glasses)`,
      scheduled_date: iso,
      notes: "Front-load 2 glasses before noon · counts on Daily HUD",
    },
    {
      title: nutrition.title,
      scheduled_date: iso,
      notes: nutrition.notes,
    },
    {
      title: fasting
        ? "Move: easy walk only (fasting day)"
        : movement.title,
      scheduled_date: iso,
      notes: fasting
        ? "Skip hard training on full fast days"
        : movement.notes,
    },
    {
      title: weekend
        ? "Mindset: flexible meal without all-or-nothing thinking"
        : "Sleep: aim for 7–9 hours tonight",
      scheduled_date: iso,
      notes: weekend
        ? "One treat is fine — return to plan at the next meal"
        : "Sleep supports hunger control and recovery",
    },
  ];

  // Meal plan suggestion for the day
  if (!fasting && dayMeals[0]) {
    checklist.push({
      title: fridayFish
        ? "Meal plan: Friday fish / plant options"
        : `Meal plan: ${summary.meal_plan?.label || diet} ideas`,
      scheduled_date: iso,
      notes: dayMeals.slice(0, 3).join(" · "),
    });
  }

  // Hour-by-hour schedule when enabled
  if (summary.hour_by_hour_schedule && summary.meal_plan) {
    const slots = buildHourByHourDay({
      fasting,
      protocol: summary.fasting_protocol || "none",
      diet,
      macros: summary.macros,
      waterGlasses: summary.water_glasses,
      mealPlan: summary.meal_plan,
    });
    for (const slot of slots) {
      checklist.push({
        title: `${slot.hour} · ${slot.title}`,
        scheduled_date: iso,
        notes: slot.note,
      });
    }
  }

  // Extra daily item mid-week: log or check-in
  if (dayIndex % 3 === 1) {
    checklist.push({
      title: "Check-in: energy, hunger, mood (30 seconds)",
      scheduled_date: iso,
      notes: "Adjust ±100 kcal only if energy is poor several days",
    });
  }

  return checklist;
}

/** Weekly specials (not every day) */
function weeklySpecials(
  weekStart: Date,
  weekIndex: number,
  summary: WeightLossPlanSummary,
  macroLine: string,
  meals: string[]
): PlanTask[] {
  const mon = format(weekStart, "yyyy-MM-dd");
  const wed = format(addDays(weekStart, 2), "yyyy-MM-dd");
  const sun = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const home = summary.recommend_home_workouts;

  const diet = summary.diet_style || "balanced";
  const groceryByDiet: Record<string, string> = {
    vegan: "Tofu/tempeh, lentils, beans, oats, produce, plant milk, nuts",
    vegetarian: "Eggs, yogurt, cheese, beans, produce, whole grains",
    keto: "Eggs, meat/fish, cheese, leafy greens, avocado, olive oil",
    paleo: "Meat/fish, eggs, veg, fruit, nuts, sweet potato",
    carnivore: "Meat, fish, eggs, salt, optional dairy",
    pescatarian: "Fish, eggs/dairy, legumes, grains, produce",
    balanced: "Eggs, yogurt, lean protein, veg, fruit, whole grains",
  };

  const specials: PlanTask[] = [
    {
      title: `Weekly: grocery / restock (${diet})`,
      scheduled_date: mon,
      notes: meals[0] || groceryByDiet[diet] || groceryByDiet.balanced,
    },
    {
      title: home
        ? "Weekly: longer home session or 25-min walk"
        : "Weekly: progressive training session",
      scheduled_date: wed,
      notes: home
        ? summary.home_workouts[1]
        : "Slight progression if recovery is good",
    },
  ];

  // Weigh-in once per week (Sunday morning vibe → use day 6)
  if (weekIndex === 0) {
    specials.push({
      title: "Weekly: baseline weigh-in (+ optional waist)",
      scheduled_date: mon,
      notes: "Same conditions each week · trend > single day",
    });
  } else {
    specials.push({
      title: "Weekly: calm weigh-in (same time/conditions)",
      scheduled_date: sun,
      notes: `Healthy pace ~${summary.weekly_loss_kg} kg/week if consistent · not medical advice`,
    });
  }

  if (weekIndex % 2 === 1) {
    specials.push({
      title: "Weekly: batch-prep protein for 2–3 days",
      scheduled_date: mon,
      notes: meals[2] || "Cook once, eat twice",
    });
  }

  if (weekIndex >= 1) {
    specials.push({
      title: "Weekly: non-scale win note (energy, clothes, mood)",
      scheduled_date: sun,
      notes: "Journal or one sentence is enough",
    });
  }

  // Cap macros reminder
  specials.push({
    title: `Weekly: confirm plan still fits (~${summary.daily_calories} kcal)`,
    scheduled_date: sun,
    notes: macroLine + " · adjust gently if needed",
  });

  return specials;
}

export function generateWeightLossPlan(
  profile: WeightLossProfile,
  deadline: string,
  busySlots?: BusySlot[]
): { plan: GeneratedPlan; summary: WeightLossPlanSummary } {
  void busySlots; // daily habits still happen on busy days; we don't skip water/food
  const summary = buildWeightLossPlan(profile, deadline);
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const end = parseISO(deadline);
  // Cap dense daily generation at 84 days (12 weeks) for performance;
  // longer goals still get full weeks of checklists up to the cap.
  const rawDays = Math.max(21, differenceInCalendarDays(end, start) + 1);
  const totalDays = Math.min(84, rawDays);
  const weekCount = Math.max(3, Math.ceil(totalDays / 7));
  const macroLine = formatMacrosLine(summary.macros);
  const meals = sampleMealIdeas(
    summary.macros,
    summary.diet_style || profile.diet_style || "balanced",
    { friday_fish_only: summary.friday_fish_only || profile.friday_fish_only }
  );

  const milestones: GeneratedPlan["milestones"] = [];

  for (let w = 0; w < weekCount; w++) {
    const weekStart = addDays(start, w * 7);
    const daysInWeek = Math.min(7, totalDays - w * 7);
    if (daysInWeek <= 0) break;

    const weekTasks: PlanTask[] = [];

    // Full checklist every day of this week
    for (let d = 0; d < daysInWeek; d++) {
      const day = addDays(weekStart, d);
      const dayIndex = w * 7 + d;
      weekTasks.push(
        ...dailyChecklist(day, dayIndex, summary, macroLine, meals)
      );
    }

    // Weekly specials
    weekTasks.push(
      ...weeklySpecials(weekStart, w, summary, macroLine, meals).filter(
        (t) => {
          // only include specials within this week's day range
          const tDate = parseISO(t.scheduled_date);
          const weekEnd = addDays(weekStart, daysInWeek - 1);
          return tDate >= weekStart && tDate <= weekEnd;
        }
      )
    );

    // Sort tasks by date for readability
    weekTasks.sort((a, b) =>
      a.scheduled_date.localeCompare(b.scheduled_date)
    );

    const target_date = format(
      addDays(weekStart, daysInWeek - 1),
      "yyyy-MM-dd"
    );

    const phase =
      w === 0
        ? "Foundations"
        : w < 3
          ? "Build rhythm"
          : w < 6
            ? "Consistency"
            : "Sustain";

    milestones.push({
      title: `Week ${w + 1} — ${phase} (daily checklist)`,
      target_date,
      tasks: weekTasks,
    });
  }

  return {
    plan: { milestones, health_summary: summary },
    summary,
  };
}
