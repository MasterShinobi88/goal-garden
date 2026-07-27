import { format } from "date-fns";
import type { BusySlot, GeneratedPlan } from "./types";
import {
  buildWeightLossPlan,
  formatMacrosLine,
  isWeightLossGoal,
  type WeightLossProfile,
} from "./health";
import { generateWeightLossPlan } from "./weight-loss-plan";
import {
  formatMoneyAmount,
  generateSavingsPlan,
  isSavingsGoal,
  type SavingsProfile,
} from "./savings-plan";
import {
  generateEarningPlan,
  isEarningGoal,
  type EarningProfile,
} from "./earning-plan";
import {
  chatCompletion,
  hasLiveAI,
  type RuntimeAIConfig,
} from "./ai-providers";
import { buildDomainMockPlan } from "./mock-planner";

export type PlanInput = {
  title: string;
  description?: string;
  deadline: string;
  success_metrics?: string;
  busySlots?: BusySlot[];
  health_profile?: WeightLossProfile;
  savings_profile?: SavingsProfile;
  earning_profile?: EarningProfile;
  category?: import("./types").GoalCategory;
  /** BYOK / multi-provider config from the client */
  ai?: Partial<RuntimeAIConfig>;
};

/** Deterministic mock planner — domain-aware, works offline without an API key */
export function mockGeneratePlan(input: PlanInput): GeneratedPlan {
  const isWL =
    input.category === "weight_loss" ||
    Boolean(input.health_profile) ||
    isWeightLossGoal(input.title, input.description);

  if (isWL && input.health_profile) {
    return generateWeightLossPlan(
      input.health_profile,
      input.deadline,
      input.busySlots
    ).plan;
  }

  const isEarn =
    input.category === "income" ||
    Boolean(input.earning_profile) ||
    isEarningGoal(input.title, input.description);

  if (isEarn && input.earning_profile) {
    const base = generateEarningPlan(
      input.earning_profile,
      input.deadline,
      input.busySlots
    );
    return { ...base.plan, earning_summary: base.summary };
  }

  const isSav =
    input.category === "savings" ||
    Boolean(input.savings_profile) ||
    isSavingsGoal(input.title, input.description);

  if (isSav && input.savings_profile) {
    return generateSavingsPlan(
      input.savings_profile,
      input.deadline,
      input.busySlots
    ).plan;
  }

  return buildDomainMockPlan({
    title: input.title,
    description: input.description,
    deadline: input.deadline,
    success_metrics: input.success_metrics,
    busySlots: input.busySlots,
    category: input.category,
  });
}

function parsePlanJson(text: string): GeneratedPlan | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned) as GeneratedPlan;
    if (!data.milestones?.length) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generatePlan(input: PlanInput): Promise<GeneratedPlan> {
  const isWL =
    input.category === "weight_loss" ||
    Boolean(input.health_profile) ||
    isWeightLossGoal(input.title, input.description);

  const isEarn =
    input.category === "income" ||
    Boolean(input.earning_profile) ||
    isEarningGoal(input.title, input.description);

  const isSav =
    input.category === "savings" ||
    Boolean(input.savings_profile) ||
    isSavingsGoal(input.title, input.description);

  const live = hasLiveAI(input.ai);

  // Earning / job / income plans (before savings — "money" is ambiguous)
  if (isEarn && input.earning_profile) {
    const base = generateEarningPlan(
      input.earning_profile,
      input.deadline,
      input.busySlots
    );
    if (!live) return { ...base.plan, earning_summary: base.summary };
    try {
      const s = base.summary;
      const prompt = `You refine an EARNING / JOB action plan. Return pure JSON only.

User goal: ${input.title}
Deadline: ${input.deadline}
Focus: ${s.focus} — aim: ${s.target_role}
Weekly actions target: ~${s.weekly_actions}
Hours/week: ${s.hours_per_week}
${s.target_income != null ? `Optional income aim: ${formatMoneyAmount(s.target_income, s.currency)}/mo` : "No fixed income number"}
Status: ${s.current_status || "not specified"}

Rules:
- This is NOT a savings plan — no "save $X today" tasks
- Concrete daily actions: applications, outreach, portfolio, interviews, pitches
- scheduled_date / target_date as YYYY-MM-DD between today and deadline
- Short deadlines get denser application/outreach tasks

JSON:
{
  "milestones": [
    {
      "title": string,
      "target_date": "YYYY-MM-DD",
      "tasks": [{ "title": string, "scheduled_date": "YYYY-MM-DD", "notes": string }]
    }
  ]
}`;
      const result = await chatCompletion(
        [
          {
            role: "system",
            content:
              "You create concrete job-search and income action plans. Return only valid JSON. Never invent savings transfer tasks.",
          },
          { role: "user", content: prompt },
        ],
        { config: input.ai, temperature: 0.35 }
      );
      const parsed = parsePlanJson(result.text);
      if (parsed) {
        return { ...parsed, earning_summary: s };
      }
    } catch {
      /* fall through */
    }
    return { ...base.plan, earning_summary: base.summary };
  }

  // Savings plans: clear daily/weekly dollar targets
  if (isSav && input.savings_profile) {
    const base = generateSavingsPlan(
      input.savings_profile,
      input.deadline,
      input.busySlots
    );
    if (!live) return base.plan;
    // Live AI optional refine kept simple — base plan is already specific
    try {
      const s = base.summary;
      const prompt = `You refine a SAVINGS action plan. Return pure JSON only.

User goal: ${input.title}
Deadline: ${input.deadline}
Target: ${formatMoneyAmount(s.target_amount, s.currency)} · already saved ${formatMoneyAmount(s.already_saved, s.currency)} · remaining ${formatMoneyAmount(s.remaining, s.currency)}
MUST KEEP these amounts in task titles:
- Daily save: ${formatMoneyAmount(s.daily_save, s.currency)}
- Weekly save: ${formatMoneyAmount(s.weekly_save, s.currency)}
- Monthly save: ${formatMoneyAmount(s.monthly_save, s.currency)}

Rules:
- Clear dollar amounts on almost every day
- Weekly checkpoint milestones toward the total
- No vague "think about money" tasks — concrete transfers, logs, no-spend days
- scheduled_date / target_date as YYYY-MM-DD between today and deadline

JSON:
{
  "milestones": [
    {
      "title": string,
      "target_date": "YYYY-MM-DD",
      "tasks": [{ "title": string, "scheduled_date": "YYYY-MM-DD", "notes": string }]
    }
  ]
}`;
      const result = await chatCompletion(
        [
          {
            role: "system",
            content:
              "You create concrete savings plans with clear dollar amounts. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        { config: input.ai, temperature: 0.35 }
      );
      const parsed = parsePlanJson(result.text);
      if (parsed) {
        return { ...parsed, savings_summary: s };
      }
    } catch {
      /* fall through */
    }
    return base.plan;
  }

  // Weight-loss plans: deterministic healthy math + optional AI refine
  if (isWL && input.health_profile) {
    const base = generateWeightLossPlan(
      input.health_profile,
      input.deadline,
      input.busySlots
    );

    if (!live) return base.plan;

    try {
      const s = base.summary;
      const prompt = `You refine a HEALTHY weight-loss action plan. Return pure JSON only.

User goal: ${input.title}
Deadline: ${input.deadline}
Profile: weight ${input.health_profile.current_weight_kg}→${input.health_profile.goal_weight_kg} kg, height ${input.health_profile.height_cm} cm, age ${input.health_profile.age}, sex ${input.health_profile.sex}, activity ${input.health_profile.activity_level}
Diet style: ${input.health_profile.diet_style || s.diet_style || "balanced"}
Friday fish only: ${Boolean(input.health_profile.friday_fish_only || s.friday_fish_only)}
Fasting: ${s.fasting_protocol || "none"} days=${JSON.stringify(s.fasting_days || [])}
Hour-by-hour: ${Boolean(s.hour_by_hour_schedule)}
Calculated targets (MUST keep these numbers in notes):
- Daily calories: ${s.daily_calories}
- Macros: ${formatMacrosLine(s.macros)}
- Water: ${s.water_liters} L (~${s.water_glasses} glasses)
- Home workouts preferred: ${s.recommend_home_workouts}
- Meal plan: ${s.meal_plan?.label || "balanced"} — ${s.meal_plan?.summary || ""}

Rules:
- Healthy sustainable pace only (no crash diets, no extreme restriction)
- Respect diet style (vegan/vegetarian/keto/paleo/carnivore/pescatarian) in meal task titles
- If Friday fish only: Fridays must use fish/seafood or plants, no land meat
- If fasting days set: those days follow the fasting protocol; keep hydration tasks
- 3–5 weekly milestones, each with 4–7 daily micro-tasks
- Include water goals, meal/macro check-ins, weekly weigh-ins
- If activity is sedentary/light: NO gym equipment — walking + bodyweight only
- scheduled_date / target_date as YYYY-MM-DD between today and deadline
- Prefer weekdays for structured workouts

JSON:
{
  "milestones": [
    {
      "title": string,
      "target_date": "YYYY-MM-DD",
      "tasks": [{ "title": string, "scheduled_date": "YYYY-MM-DD", "notes": string }]
    }
  ]
}`;

      const result = await chatCompletion(
        [
          {
            role: "system",
            content:
              "You are a careful health coach. Never recommend unsafe deficits. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        { config: input.ai, temperature: 0.35 }
      );
      const parsed = parsePlanJson(result.text);
      if (parsed) {
        return {
          ...parsed,
          health_summary: s,
        };
      }
    } catch (err) {
      console.error("AI weight-loss plan refine failed:", err);
    }

    return base.plan;
  }

  if (!live) {
    return mockGeneratePlan(input);
  }

  const busySummary =
    input.busySlots
      ?.slice(0, 20)
      .map((s) => `${s.start}: ${s.title}`)
      .join("\n") || "None provided";

  const prompt = `You are a realistic productivity coach. Create a goal plan as pure JSON (no markdown).

Goal title: ${input.title}
Description: ${input.description || "n/a"}
Deadline: ${input.deadline}
Success metrics: ${input.success_metrics || "n/a"}
Today: ${format(new Date(), "yyyy-MM-dd")}
Busy calendar days (avoid if possible):
${busySummary}

Rules:
- Generate 3 to 5 weekly milestones before the deadline
- Each milestone has 3 to 7 daily micro-tasks
- scheduled_date and target_date as YYYY-MM-DD
- Spread work realistically (no stacking everything on one day)
- Prefer weekdays
- Task titles should be concrete actions (verb-first)

JSON shape:
{
  "milestones": [
    {
      "title": string,
      "target_date": "YYYY-MM-DD",
      "tasks": [
        { "title": string, "scheduled_date": "YYYY-MM-DD", "notes": string optional }
      ]
    }
  ]
}`;

  try {
    const result = await chatCompletion(
      [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      { config: input.ai, temperature: 0.4 }
    );
    const parsed = parsePlanJson(result.text);
    if (parsed) return parsed;
  } catch (err) {
    console.error("AI plan generation failed, using mock:", err);
  }

  return mockGeneratePlan(input);
}

// re-export for API route convenience
export { buildWeightLossPlan, isWeightLossGoal };
export { buildSavingsPlan, isSavingsGoal } from "./savings-plan";
