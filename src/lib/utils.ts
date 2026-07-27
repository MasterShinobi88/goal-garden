import { clsx, type ClassValue } from "clsx";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isSunday,
  parseISO,
  startOfWeek,
} from "date-fns";
import type { DailyTask, GoalWithTree, Milestone } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDisplayDate(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function calcGoalProgress(goal: GoalWithTree): number {
  const tasks = goal.milestones.flatMap((m) => m.daily_tasks);
  if (tasks.length === 0) {
    const done = goal.milestones.filter((m) => m.completed).length;
    return goal.milestones.length
      ? Math.round((done / goal.milestones.length) * 100)
      : 0;
  }
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

export function flattenTasks(goal: GoalWithTree): DailyTask[] {
  return goal.milestones.flatMap((m) => m.daily_tasks);
}

export function getMissedTasks(goals: GoalWithTree[], asOf = todayISO()): DailyTask[] {
  return goals
    .filter((g) => !g.archived)
    .flatMap(flattenTasks)
    .filter((t) => !t.completed && t.scheduled_date < asOf);
}

export function getTreeStage(progress: number): number {
  // 0 sapling → 5 full fruit tree
  if (progress <= 0) return 0;
  if (progress < 20) return 1;
  if (progress < 40) return 2;
  if (progress < 60) return 3;
  if (progress < 85) return 4;
  return 5;
}

export function daysUntil(deadline: string) {
  return differenceInCalendarDays(parseISO(deadline), new Date());
}

export function isReviewDay(date = new Date()) {
  return isSunday(date);
}

export function weekStartISO(date = new Date()) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function nextAvailableDates(
  from: string,
  count: number,
  busyDates: Set<string> = new Set(),
  skipWeekends = false
): string[] {
  const results: string[] = [];
  let cursor = parseISO(from);
  const today = parseISO(todayISO());
  if (isBefore(cursor, today)) cursor = today;

  let guard = 0;
  while (results.length < count && guard < 120) {
    const iso = format(cursor, "yyyy-MM-dd");
    const day = cursor.getDay();
    const weekend = day === 0 || day === 6;
    if ((!skipWeekends || !weekend) && !busyDates.has(iso)) {
      results.push(iso);
    }
    cursor = addDays(cursor, 1);
    guard++;
  }
  return results;
}

export function encouragingMessage(missedCount: number): string {
  const messages = [
    "Life happens — your tree is still growing. Let's gently replant a few tasks.",
    "No guilt, just green shoots. A small shift keeps the momentum alive.",
    "Missed a few? That's data, not failure. We'll find freer days together.",
    "Your future self is cheering. One reschedule at a time.",
    "Progress isn't linear. Reset the path and keep walking.",
  ];
  if (missedCount === 0) return "You're on track — keep watering your goals!";
  return messages[missedCount % messages.length];
}

export function autoCompleteMilestones(
  milestones: (Milestone & { daily_tasks: DailyTask[] })[]
) {
  return milestones.map((m) => {
    const allDone =
      m.daily_tasks.length > 0 && m.daily_tasks.every((t) => t.completed);
    return { ...m, completed: allDone || m.completed };
  });
}

/**
 * Streak with optional weekly grace day.
 * Completing a task today continues the streak if lastActive was yesterday
 * OR yesterday was covered by an unused grace day (once per ISO week).
 */
export function computeStreak(
  tasks: DailyTask[],
  previousStreak: number,
  lastActive: string | null,
  options?: { graceDayUsed?: string | null }
): { streak: number; lastActive: string; usedGrace?: boolean } {
  const today = todayISO();
  const yesterday = format(addDays(parseISO(today), -1), "yyyy-MM-dd");
  const completedToday = tasks.some(
    (t) => t.completed && t.scheduled_date === today
  );
  if (!completedToday) {
    return { streak: previousStreak, lastActive: lastActive ?? today };
  }
  if (lastActive === today) {
    return { streak: previousStreak, lastActive: today };
  }
  if (lastActive === yesterday) {
    return { streak: previousStreak + 1, lastActive: today };
  }

  // Grace: one missed calendar day allowed per week if grace not used this week
  const twoDaysAgo = format(addDays(parseISO(today), -2), "yyyy-MM-dd");
  const weekKey = weekStartISO(parseISO(today));
  const graceAvailable = options?.graceDayUsed !== weekKey;
  if (lastActive === twoDaysAgo && graceAvailable && previousStreak > 0) {
    return {
      streak: previousStreak + 1,
      lastActive: today,
      usedGrace: true,
    };
  }

  return { streak: 1, lastActive: today };
}
