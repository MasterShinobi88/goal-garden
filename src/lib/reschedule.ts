import { format, parseISO, addDays } from "date-fns";
import type { BusySlot, DailyTask, GoalWithTree } from "./types";
import { findFreeDays, suggestSlotForTask } from "./calendar";
import { encouragingMessage, todayISO } from "./utils";

export type RescheduleProposal = {
  taskId: string;
  title: string;
  from: string;
  to: string;
  goalTitle: string;
};

export type RescheduleResult = {
  message: string;
  proposals: RescheduleProposal[];
};

export function buildRescheduleProposals(
  goals: GoalWithTree[],
  busy: BusySlot[] = []
): RescheduleResult {
  const asOf = todayISO();
  const allTasks = goals
    .filter((g) => !g.archived)
    .flatMap((g) =>
      g.milestones.flatMap((m) =>
        m.daily_tasks.map((t) => ({
          task: t,
          goalTitle: g.title,
        }))
      )
    );

  const missed = allTasks.filter(
    ({ task }) => !task.completed && task.scheduled_date < asOf
  );

  const freeDays = findFreeDays(
    asOf,
    21,
    busy,
    allTasks.map((x) => x.task)
  );

  const proposals: RescheduleProposal[] = [];
  const reserved = new Set<string>();

  for (const { task, goalTitle } of missed) {
    const available = freeDays.filter((d) => !reserved.has(`${d}:${task.id}`));
    // Prefer spreading: avoid same day stacking
    let to: string | null = null;
    for (const day of available) {
      const key = day;
      const countOnDay = proposals.filter((p) => p.to === key).length;
      if (countOnDay < 2) {
        to = day;
        break;
      }
    }
    if (!to) to = suggestSlotForTask(task, freeDays);
    if (!to) {
      to = format(addDays(parseISO(asOf), 1), "yyyy-MM-dd");
    }
    reserved.add(to);
    proposals.push({
      taskId: task.id,
      title: task.title,
      from: task.scheduled_date,
      to,
      goalTitle,
    });
  }

  return {
    message: encouragingMessage(missed.length),
    proposals,
  };
}

export function applyProposals(
  goals: GoalWithTree[],
  proposals: RescheduleProposal[]
): GoalWithTree[] {
  const map = new Map(proposals.map((p) => [p.taskId, p.to]));
  return goals.map((g) => ({
    ...g,
    milestones: g.milestones.map((m) => ({
      ...m,
      daily_tasks: m.daily_tasks.map((t) =>
        map.has(t.id)
          ? { ...t, scheduled_date: map.get(t.id) as string }
          : t
      ),
    })),
  }));
}

export function summarizeWeek(goals: GoalWithTree[], weekStart: string) {
  const weekEnd = format(addDays(parseISO(weekStart), 6), "yyyy-MM-dd");
  const tasks: DailyTask[] = goals
    .filter((g) => !g.archived)
    .flatMap((g) => g.milestones.flatMap((m) => m.daily_tasks))
    .filter((t) => t.scheduled_date >= weekStart && t.scheduled_date <= weekEnd);

  const completed = tasks.filter((t) => t.completed).length;
  const missed = tasks.filter(
    (t) => !t.completed && t.scheduled_date < todayISO()
  ).length;
  const remaining = tasks.filter(
    (t) => !t.completed && t.scheduled_date >= todayISO()
  ).length;

  let suggestions =
    "Keep the pace steady — protect one focus block each weekday.";
  if (missed > completed) {
    suggestions =
      "You had more misses than completes. Shrink daily scope or move hard tasks earlier in the day.";
  } else if (completed > 0 && missed === 0) {
    suggestions =
      "Excellent week. Consider raising ambition slightly next week — add one stretch micro-task.";
  } else if (missed > 0) {
    suggestions =
      "Reschedule missed items to free days and batch similar tasks. Progress over perfection.";
  }

  return { completed, missed, remaining, total: tasks.length, suggestions };
}
