"use client";

import type {
  GoalWithTree,
  UserPreferences,
  WeeklyReview,
} from "./types";
import { buildDemoGoal, buildDemoWeightLossGoal } from "./demo-data";
import {
  uid,
  todayISO,
  computeStreak,
  autoCompleteMilestones,
  weekStartISO,
} from "./utils";

const GOALS_KEY = "goal-garden:goals";
const PREFS_KEY = "goal-garden:prefs";
const STREAK_KEY = "goal-garden:streak";
const SESSION_KEY = "goal-garden:session";
const REVIEWS_KEY = "goal-garden:reviews";

export type DemoSession = {
  id: string;
  email: string;
  display_name: string;
};

/**
 * Demo mode = local-only fake accounts (NOT for production web).
 *
 * Production browser: Supabase must be configured and DEMO_MODE must not be true.
 * Desktop Electron: always local storage (offline-first).
 */
export function isDemoMode() {
  // Explicit force (local dev only)
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;

  // Desktop builds are offline-first on device storage
  if (process.env.NEXT_PUBLIC_DESKTOP === "true") return true;
  if (typeof window !== "undefined" && window.goalGarden?.isDesktop) {
    return true;
  }

  // Web without Supabase falls back to demo so the site still boots in CI —
  // Netlify production must set real Supabase env vars.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("your-project")) return true;

  return false;
}

/** True when browser app expects real accounts (sign up / sign in). */
export function requiresRealAccount() {
  return !isDemoMode();
}

export function getSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function setSession(session: DemoSession | null) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function demoSignUp(email: string, password: string, name?: string) {
  void password;
  const session: DemoSession = {
    id: uid(),
    email,
    display_name: name || email.split("@")[0],
  };
  setSession(session);
  // seed empty goals
  if (!localStorage.getItem(GOALS_KEY)) {
    saveGoals([]);
  }
  return session;
}

export function demoSignIn(email: string, password: string) {
  void password;
  const existing = getSession();
  if (existing && existing.email === email) return existing;
  return demoSignUp(email, password);
}

export function demoSignOut() {
  setSession(null);
}

export function loadGoals(): GoalWithTree[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(GOALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GoalWithTree[];
  } catch {
    return [];
  }
}

export function saveGoals(goals: GoalWithTree[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  window.dispatchEvent(new CustomEvent("goal-garden:update"));
}

export function loadPrefs(): UserPreferences {
  if (typeof window === "undefined") return defaultPrefs();
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return defaultPrefs();
  try {
    return { ...defaultPrefs(), ...(JSON.parse(raw) as UserPreferences) };
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(prefs: UserPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function defaultPrefs(): UserPreferences {
  return {
    calendar_provider: "mock",
    work_start_hour: 9,
    work_end_hour: 17,
    encouragement_style: "gentle",
    sunday_review_enabled: true,
    theme: "dark",
    sound_enabled: false,
    reduced_motion: false,
    grace_day_used: null,
    notifications_enabled: false,
    notifications_daily: true,
    notifications_weekly: true,
    notifications_hour: 9,
    notifications_quiet_start: 21,
    notifications_quiet_end: 8,
  };
}

export function loadStreak(): { streak: number; lastActive: string | null } {
  if (typeof window === "undefined") return { streak: 0, lastActive: null };
  const raw = localStorage.getItem(STREAK_KEY);
  if (!raw) return { streak: 0, lastActive: null };
  try {
    return JSON.parse(raw) as { streak: number; lastActive: string | null };
  } catch {
    return { streak: 0, lastActive: null };
  }
}

export function bumpStreakFromTasks(goals: GoalWithTree[]) {
  const prev = loadStreak();
  const prefs = loadPrefs();
  const tasks = goals.flatMap((g) =>
    g.milestones.flatMap((m) => m.daily_tasks)
  );
  const next = computeStreak(tasks, prev.streak, prev.lastActive, {
    graceDayUsed: prefs.grace_day_used,
  });
  if (next.usedGrace) {
    savePrefs({
      ...prefs,
      grace_day_used: weekStartISO(),
    });
  }
  localStorage.setItem(
    STREAK_KEY,
    JSON.stringify({ streak: next.streak, lastActive: next.lastActive })
  );
  return { streak: next.streak, lastActive: next.lastActive };
}

export function seedDemoGoal(kind: "project" | "weight_loss" | "both" = "both") {
  const session = getSession();
  const userId = session?.id ?? "demo-user";
  let goals = loadGoals();

  if (
    (kind === "project" || kind === "both") &&
    !goals.some((g) => g.title.includes("side project"))
  ) {
    goals = [buildDemoGoal(userId), ...goals];
  }
  if (
    (kind === "weight_loss" || kind === "both") &&
    !goals.some((g) => g.category === "weight_loss" || g.title.toLowerCase().includes("lose weight"))
  ) {
    goals = [buildDemoWeightLossGoal(userId), ...goals];
  }

  saveGoals(goals);
  return goals;
}

export function upsertGoal(goal: GoalWithTree) {
  const goals = loadGoals();
  const idx = goals.findIndex((g) => g.id === goal.id);
  const normalized: GoalWithTree = {
    ...goal,
    milestones: autoCompleteMilestones(goal.milestones),
    updated_at: new Date().toISOString(),
  };
  let next: GoalWithTree[];
  if (idx >= 0) {
    next = [...goals];
    next[idx] = normalized;
  } else {
    next = [normalized, ...goals];
  }
  saveGoals(next);
  bumpStreakFromTasks(next);
  return next;
}

export function deleteGoal(id: string) {
  const next = loadGoals().filter((g) => g.id !== id);
  saveGoals(next);
  return next;
}

export function toggleTask(taskId: string, completed?: boolean) {
  const goals = loadGoals().map((g) => ({
    ...g,
    milestones: g.milestones.map((m) => ({
      ...m,
      daily_tasks: m.daily_tasks.map((t) =>
        t.id === taskId
          ? { ...t, completed: completed ?? !t.completed }
          : t
      ),
    })),
  }));
  const withMilestones = goals.map((g) => ({
    ...g,
    milestones: autoCompleteMilestones(g.milestones),
  }));
  // auto-archive fully complete goals
  const final = withMilestones.map((g) => {
    const progress =
      g.milestones.flatMap((m) => m.daily_tasks).length === 0
        ? 0
        : g.milestones
            .flatMap((m) => m.daily_tasks)
            .every((t) => t.completed);
    return progress && !g.archived
      ? { ...g, archived: true, updated_at: new Date().toISOString() }
      : g;
  });
  saveGoals(final);
  bumpStreakFromTasks(final);
  return final;
}

export function updateTaskTitle(taskId: string, title: string) {
  const goals = loadGoals().map((g) => ({
    ...g,
    milestones: g.milestones.map((m) => ({
      ...m,
      daily_tasks: m.daily_tasks.map((t) =>
        t.id === taskId ? { ...t, title } : t
      ),
    })),
  }));
  saveGoals(goals);
  return goals;
}

export function updateMilestoneTitle(milestoneId: string, title: string) {
  const goals = loadGoals().map((g) => ({
    ...g,
    milestones: g.milestones.map((m) =>
      m.id === milestoneId ? { ...m, title } : m
    ),
  }));
  saveGoals(goals);
  return goals;
}

export function rescheduleTask(taskId: string, scheduled_date: string) {
  const goals = loadGoals().map((g) => ({
    ...g,
    milestones: g.milestones.map((m) => ({
      ...m,
      daily_tasks: m.daily_tasks.map((t) =>
        t.id === taskId ? { ...t, scheduled_date } : t
      ),
    })),
  }));
  saveGoals(goals);
  return goals;
}

export function loadReviews(): WeeklyReview[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REVIEWS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WeeklyReview[];
  } catch {
    return [];
  }
}

export function saveReview(review: WeeklyReview) {
  const all = loadReviews().filter(
    (r) => !(r.user_id === review.user_id && r.week_start === review.week_start)
  );
  all.unshift(review);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  return all;
}

export function ensureSessionForDemo() {
  let s = getSession();
  if (!s) {
    s = demoSignUp("demo@goal.garden", "demo-password", "Garden Grower");
  }
  return s;
}

export { todayISO, uid };
