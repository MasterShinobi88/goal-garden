"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { GeneratedPlan, GoalWithTree } from "@/lib/types";
import {
  deleteGoal as localDelete,
  loadGoals,
  rescheduleTask as localReschedule,
  saveGoals,
  seedDemoGoal as localSeed,
  toggleTask as localToggle,
  updateMilestoneTitle as localMilestoneTitle,
  updateTaskTitle as localTaskTitle,
  upsertGoal as localUpsert,
  uid,
} from "@/lib/local-store";
import { autoCompleteMilestones } from "@/lib/utils";

export async function fetchGoals(userId: string): Promise<GoalWithTree[]> {
  if (!isSupabaseConfigured()) {
    return loadGoals();
  }

  const supabase = createClient();
  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !goals) {
    console.error(error);
    return loadGoals();
  }

  const result: GoalWithTree[] = [];
  for (const g of goals) {
    const { data: milestones } = await supabase
      .from("milestones")
      .select("*")
      .eq("goal_id", g.id)
      .order("sort_order", { ascending: true });

    const withTasks = [];
    for (const m of milestones ?? []) {
      const { data: tasks } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("milestone_id", m.id)
        .order("sort_order", { ascending: true });
      withTasks.push({ ...m, daily_tasks: tasks ?? [] });
    }
    result.push({ ...g, milestones: withTasks });
  }
  // cache locally for offline UI snappiness
  saveGoals(result);
  return result;
}

export async function createGoalWithPlan(
  userId: string,
  input: {
    title: string;
    description?: string;
    deadline: string;
    success_metrics?: string;
    category?: import("./types").GoalCategory;
    health_profile?: import("./health").WeightLossProfile;
    savings_profile?: import("./savings-plan").SavingsProfile;
    earning_profile?: import("./earning-plan").EarningProfile;
    plant_type?: import("./plants").PlantType;
  },
  plan: GeneratedPlan
): Promise<GoalWithTree> {
  const now = new Date().toISOString();
  const goal: GoalWithTree = {
    id: uid(),
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    deadline: input.deadline,
    success_metrics: input.success_metrics ?? null,
    archived: false,
    category:
      input.category ??
      (input.health_profile
        ? "weight_loss"
        : input.earning_profile
          ? "income"
          : input.savings_profile
            ? "savings"
            : "general"),
    health_profile: input.health_profile ?? null,
    health_plan: plan.health_summary ?? null,
    savings_profile: input.savings_profile ?? null,
    savings_plan: plan.savings_summary ?? null,
    earning_profile: input.earning_profile ?? null,
    earning_plan: plan.earning_summary ?? null,
    plant_type: input.plant_type ?? "oak",
    created_at: now,
    updated_at: now,
    milestones: plan.milestones.map((m, mi) => {
      const mid = uid();
      return {
        id: mid,
        goal_id: "", // filled below
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
          completed: false,
          notes: t.notes ?? null,
          sort_order: ti,
          created_at: now,
        })),
      };
    }),
  };
  goal.milestones = goal.milestones.map((m) => ({ ...m, goal_id: goal.id }));

  if (!isSupabaseConfigured()) {
    localUpsert(goal);
    return goal;
  }

  const supabase = createClient();
  const { data: inserted, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      title: goal.title,
      description: goal.description,
      deadline: goal.deadline,
      success_metrics: goal.success_metrics,
      category: goal.category ?? "general",
      health_profile: goal.health_profile ?? null,
      health_plan: goal.health_plan ?? null,
      savings_profile: goal.savings_profile ?? null,
      savings_plan: goal.savings_plan ?? null,
      earning_profile: goal.earning_profile ?? null,
      earning_plan: goal.earning_plan ?? null,
      plant_type: goal.plant_type ?? "oak",
    })
    .select()
    .single();

  if (error || !inserted) {
    console.error(error);
    localUpsert(goal);
    return goal;
  }

  goal.id = inserted.id;
  for (const m of goal.milestones) {
    m.goal_id = inserted.id;
    const { data: midRow, error: mErr } = await supabase
      .from("milestones")
      .insert({
        goal_id: inserted.id,
        title: m.title,
        target_date: m.target_date,
        completed: false,
        sort_order: m.sort_order,
      })
      .select()
      .single();
    if (mErr || !midRow) continue;
    m.id = midRow.id;
    for (const t of m.daily_tasks) {
      t.milestone_id = midRow.id;
      const { data: tRow } = await supabase
        .from("daily_tasks")
        .insert({
          milestone_id: midRow.id,
          title: t.title,
          scheduled_date: t.scheduled_date,
          completed: false,
          notes: t.notes,
          sort_order: t.sort_order,
        })
        .select()
        .single();
      if (tRow) t.id = tRow.id;
    }
  }

  localUpsert(goal);
  return goal;
}

export async function setTaskCompleted(taskId: string, completed: boolean) {
  if (!isSupabaseConfigured()) {
    const next = localToggle(taskId, completed);
    if (completed && typeof window !== "undefined") {
      const { fireCelebration } = await import("@/components/Celebration");
      fireCelebration({
        title: "Leaf unlocked!",
        subtitle: "Your progress tree just grew a little greener.",
      });
    }
    return next;
  }
  const supabase = createClient();
  await supabase.from("daily_tasks").update({ completed }).eq("id", taskId);
  const next = localToggle(taskId, completed);
  if (completed && typeof window !== "undefined") {
    const { fireCelebration } = await import("@/components/Celebration");
    fireCelebration({
      title: "Leaf unlocked!",
      subtitle: "Your progress tree just grew a little greener.",
    });
  }
  return next;
}

export async function setTaskTitle(taskId: string, title: string) {
  if (!isSupabaseConfigured()) return localTaskTitle(taskId, title);
  const supabase = createClient();
  await supabase.from("daily_tasks").update({ title }).eq("id", taskId);
  return localTaskTitle(taskId, title);
}

export async function setMilestoneTitle(milestoneId: string, title: string) {
  if (!isSupabaseConfigured()) return localMilestoneTitle(milestoneId, title);
  const supabase = createClient();
  await supabase.from("milestones").update({ title }).eq("id", milestoneId);
  return localMilestoneTitle(milestoneId, title);
}

export async function setTaskDate(taskId: string, scheduled_date: string) {
  if (!isSupabaseConfigured()) return localReschedule(taskId, scheduled_date);
  const supabase = createClient();
  await supabase
    .from("daily_tasks")
    .update({ scheduled_date })
    .eq("id", taskId);
  return localReschedule(taskId, scheduled_date);
}

export async function archiveGoal(goalId: string, archived = true) {
  const goals = loadGoals().map((g) =>
    g.id === goalId
      ? { ...g, archived, updated_at: new Date().toISOString() }
      : g
  );
  saveGoals(goals);
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.from("goals").update({ archived }).eq("id", goalId);
  }
  return goals;
}

export async function removeGoal(goalId: string) {
  if (!isSupabaseConfigured()) return localDelete(goalId);
  const supabase = createClient();
  await supabase.from("goals").delete().eq("id", goalId);
  return localDelete(goalId);
}

export async function seedDemo(
  userId: string,
  kind: "project" | "weight_loss" | "both" = "both"
) {
  void userId;
  return localSeed(kind);
}

export function syncMilestones(goals: GoalWithTree[]) {
  return goals.map((g) => ({
    ...g,
    milestones: autoCompleteMilestones(g.milestones),
  }));
}
