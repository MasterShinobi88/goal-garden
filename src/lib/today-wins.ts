"use client";

import type { DailyTask, GoalWithTree } from "./types";
import { todayISO } from "./utils";

export type TodayTaskItem = {
  task: DailyTask;
  goalId: string;
  goalTitle: string;
  milestoneTitle: string;
};

export function getTodayTasks(goals: GoalWithTree[], date = todayISO()): TodayTaskItem[] {
  const items: TodayTaskItem[] = [];
  for (const g of goals) {
    if (g.archived) continue;
    for (const m of g.milestones) {
      for (const t of m.daily_tasks) {
        if (t.scheduled_date === date) {
          items.push({
            task: t,
            goalId: g.id,
            goalTitle: g.title,
            milestoneTitle: m.title,
          });
        }
      }
    }
  }
  // Incomplete first, then completed
  return items.sort((a, b) => {
    if (a.task.completed === b.task.completed) return 0;
    return a.task.completed ? 1 : -1;
  });
}

export function todayWinsStats(items: TodayTaskItem[]) {
  const total = items.length;
  const done = items.filter((i) => i.task.completed).length;
  const open = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, done, open, pct };
}

export function prideMessage(done: number, total: number): string {
  if (total === 0) {
    return "No tasks scheduled today — still a good day to plant something small.";
  }
  if (done === 0) {
    return "Your first checkmark of the day is waiting. One leaf is enough to start.";
  }
  if (done === total) {
    return "Everything on today’s list is done. That’s a full canopy day — be proud.";
  }
  if (done / total >= 0.7) {
    return `Strong day — ${done} of ${total} complete. You’re building real momentum.`;
  }
  if (done >= 3) {
    return `${done} wins already. That consistency is the whole game.`;
  }
  return `${done} win${done === 1 ? "" : "s"} logged. Stack another when you’re ready.`;
}
