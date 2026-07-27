import { addDays, format } from "date-fns";
import type { DailyTask, GoalWithTree, Milestone } from "./types";
import { uid } from "./utils";
import { generateWeightLossPlan } from "./weight-loss-plan";

function d(offset: number) {
  return format(addDays(new Date(), offset), "yyyy-MM-dd");
}

/** Sample goal: Launch a side project in 8 weeks */
export function buildDemoGoal(userId: string): GoalWithTree {
  const goalId = uid();
  const deadline = d(56);

  const weekDefs: { title: string; tasks: string[] }[] = [
    {
      title: "Week 1 — Clarify vision & stack",
      tasks: [
        "Write one-sentence product pitch",
        "List must-have vs nice-to-have features",
        "Choose tech stack and hosting",
        "Create project repo and README",
        "Sketch main user flow on paper",
      ],
    },
    {
      title: "Week 2 — Design & architecture",
      tasks: [
        "Draft low-fi wireframes for core screens",
        "Define data models",
        "Set up auth skeleton",
        "Pick color palette and typography",
        "Write acceptance criteria for MVP",
      ],
    },
    {
      title: "Week 3 — Core feature vertical slice",
      tasks: [
        "Implement primary create/read flow",
        "Add basic validation",
        "Connect UI to API",
        "Seed sample data",
        "Smoke-test happy path",
      ],
    },
    {
      title: "Week 4 — Polish main journey",
      tasks: [
        "Handle empty and error states",
        "Add loading indicators",
        "Improve mobile layout",
        "Write unit tests for critical logic",
        "Fix top 5 bugs from self-QA",
      ],
    },
    {
      title: "Week 5 — Secondary features",
      tasks: [
        "Ship settings or preferences page",
        "Add export or share capability",
        "Implement soft delete / archive",
        "Instrument basic analytics events",
        "Document setup for a new contributor",
      ],
    },
    {
      title: "Week 6 — Beta readiness",
      tasks: [
        "Deploy staging environment",
        "Invite 3 friends for feedback",
        "Create feedback form",
        "Triage feedback into backlog",
        "Ship highest-impact fixes",
      ],
    },
    {
      title: "Week 7 — Launch prep",
      tasks: [
        "Write landing page copy",
        "Record 60s demo video",
        "Prepare Product Hunt / social post",
        "Set up custom domain",
        "Final security checklist",
      ],
    },
    {
      title: "Week 8 — Launch & learn",
      tasks: [
        "Deploy production",
        "Publish launch announcement",
        "Monitor errors for 48 hours",
        "Respond to early users",
        "Write retrospective notes",
        "Plan next iteration",
      ],
    },
  ];

  const milestones: (Milestone & { daily_tasks: DailyTask[] })[] =
    weekDefs.map((week, wi) => {
      const mid = uid();
      const weekStart = wi * 7;
      const target = d(weekStart + 6);
      const tasks: DailyTask[] = week.tasks.map((title, ti) => ({
        id: uid(),
        milestone_id: mid,
        title,
        scheduled_date: d(weekStart + ti),
        completed: wi === 0 && ti < 2, // partial progress for demo
        notes: null,
        sort_order: ti,
        created_at: new Date().toISOString(),
      }));

      return {
        id: mid,
        goal_id: goalId,
        title: week.title,
        target_date: target,
        completed: false,
        sort_order: wi,
        created_at: new Date().toISOString(),
        daily_tasks: tasks,
      };
    });

  return {
    id: goalId,
    user_id: userId,
    title: "Launch a side project in 8 weeks",
    description:
      "Ship a polished MVP of a personal product, get real users, and learn from launch week.",
    deadline,
    success_metrics:
      "Live URL, ≥10 signups or stars, public launch post, and a written retrospective.",
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    milestones,
  };
}

/** Sample weight-loss goal with sedentary profile → home workouts + water */
export function buildDemoWeightLossGoal(userId: string): GoalWithTree {
  const profile = {
    current_weight_kg: 86,
    goal_weight_kg: 76,
    height_cm: 170,
    age: 34,
    sex: "female" as const,
    activity_level: "sedentary" as const,
    waist_cm: 92,
    units: "metric" as const,
  };
  const deadline = d(84);
  const { plan, summary } = generateWeightLossPlan(profile, deadline);

  const goalId = uid();
  const now = new Date().toISOString();
  const milestones: (Milestone & { daily_tasks: DailyTask[] })[] =
    plan.milestones.map((m, mi) => {
      const mid = uid();
      return {
        id: mid,
        goal_id: goalId,
        title: m.title,
        target_date: m.target_date,
        completed: false,
        sort_order: mi,
        created_at: now,
        daily_tasks: m.tasks.map((t, ti) => ({
          id: uid(),
          milestone_id: mid,
          title: t.title,
          scheduled_date: t.scheduled_date,
          completed: mi === 0 && ti < 1,
          notes: t.notes ?? null,
          sort_order: ti,
          created_at: now,
        })),
      };
    });

  return {
    id: goalId,
    user_id: userId,
    title: "Lose weight healthily in 12 weeks",
    description:
      "Build sustainable habits: protein-forward meals, daily water, and no-equipment home movement.",
    deadline,
    success_metrics: "Reach ~76 kg with steady energy, better sleep, and weekly weigh-ins",
    archived: false,
    category: "weight_loss",
    health_profile: profile,
    health_plan: summary,
    created_at: now,
    updated_at: now,
    milestones,
  };
}

export const ENCOURAGING_COPY = [
  "Every completed task grows a new leaf.",
  "Consistency compounds — show up for one micro-task today.",
  "Your tree remembers progress, not perfection.",
  "Small daily work beats heroic weekends.",
  "Hydrate first — progress loves water.",
];
