import type { GoalWithTree } from "./types";
import type { DailyLog } from "./daily-log";
import { calcGoalProgress, todayISO } from "./utils";
import { formatMacrosLine } from "./health";
import { improvedMockCoachReply } from "./mock-coach";

export type CoachMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export function buildCoachContext(
  goals: GoalWithTree[],
  daily?: DailyLog | null,
  streak = 0
): string {
  const active = goals.filter((g) => !g.archived);
  const lines: string[] = [
    `Today: ${todayISO()}`,
    `Active goals: ${active.length}`,
    `Day streak: ${streak}`,
  ];

  if (daily) {
    lines.push(
      `Daily log: water ${daily.water_glasses}/${daily.water_target} glasses, movement ${daily.movement_done ? "done" : "not yet"}, kcal logged ${daily.kcal_eaten ?? "—"} / target ${daily.kcal_target ?? "—"}`
    );
  }

  for (const g of active.slice(0, 4)) {
    const progress = calcGoalProgress(g);
    lines.push(
      `Goal "${g.title}" — ${progress}% complete, deadline ${g.deadline}`
    );
    if (g.health_plan) {
      lines.push(
        `  Nutrition: ${formatMacrosLine(g.health_plan.macros)}, water ${g.health_plan.water_liters}L, home workouts: ${g.health_plan.recommend_home_workouts}`
      );
    }
    const todayTasks = g.milestones
      .flatMap((m) => m.daily_tasks)
      .filter((t) => t.scheduled_date === todayISO());
    if (todayTasks.length) {
      lines.push(
        `  Today tasks: ${todayTasks
          .map((t) => `${t.completed ? "✓" : "○"} ${t.title}`)
          .join("; ")}`
      );
    }
  }

  return lines.join("\n");
}

export const COACH_SYSTEM = `You are Goal Garden's premium coach — warm, concise, and science-light.
Rules:
- Answer the user's actual question first. Do not pivot to generic tips if they asked something specific.
- Celebrate small wins; never guilt-trip.
- For weight-loss goals, reinforce sustainable pace, protein, water, sleep, and home movement when activity is low.
- Prefer 2–4 short paragraphs or a short bullet list.
- Tie advice to the user's actual goals, tasks, and daily log when relevant — not as a substitute for answering.
- Not medical advice; suggest clinicians for medical concerns.
- Brand voice: garden metaphor used sparingly, never instead of a real answer.
- On water quality (distilled, RO, tap, mineral): be accurate and balanced — hydration benefit is mainly volume; minerals usually come more from food.`;

/** Offline coach — intent-aware, garden-grounded */
export function mockCoachReply(userMessage: string, context: string): string {
  return improvedMockCoachReply(userMessage, context);
}
