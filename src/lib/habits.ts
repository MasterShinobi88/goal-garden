/**
 * Daily habits — small actions that compound.
 * Priority 1 must finish before lower priorities feel "done."
 */
import { uid, todayISO } from "./utils";

export type HabitPriority = 1 | 2 | 3;

export type Habit = {
  id: string;
  title: string;
  notes?: string;
  /** 1 = do first (must), 2 = should, 3 = boost */
  priority: HabitPriority;
  active: boolean;
  /** Optional link to a goal id */
  goal_id?: string | null;
  created_at: string;
  sort_order: number;
};

export type HabitDayState = {
  date: string;
  /** habitId → completed */
  done: Record<string, boolean>;
};

const HABITS_KEY = "goal-garden:habits";
const DAYS_KEY = "goal-garden:habit-days";

export const PRIORITY_META: Record<
  HabitPriority,
  { label: string; short: string; hint: string; color: string }
> = {
  1: {
    label: "Must do first",
    short: "P1",
    hint: "Non‑negotiables — protect these before everything else",
    color: "text-rose-300",
  },
  2: {
    label: "Should do",
    short: "P2",
    hint: "Strong compounders once P1s are checked",
    color: "text-amber-300",
  },
  3: {
    label: "Boost",
    short: "P3",
    hint: "Nice extras when the day still has room",
    color: "text-sky-300",
  },
};

function defaultHabits(): Habit[] {
  const now = new Date().toISOString();
  const seeds: Omit<Habit, "id" | "created_at">[] = [
    {
      title: "Protect sleep window (wind-down started)",
      notes: "Screens down · dim lights · same bedtime — longevity #1 lever",
      priority: 1,
      active: true,
      sort_order: 0,
    },
    {
      title: "Morning water (2 glasses)",
      notes: "Before coffee — compounds into energy all day",
      priority: 1,
      active: true,
      sort_order: 1,
    },
    {
      title: "One focused block on top goal (25–50 min)",
      notes: "Most important goal work first",
      priority: 1,
      active: true,
      sort_order: 2,
    },
    {
      title: "Move body 10+ minutes",
      notes: "Walk, stretch, or training — any intentional move",
      priority: 2,
      active: true,
      sort_order: 3,
    },
    {
      title: "Protein at first real meal",
      notes: "Supports muscle & recovery (longevity-friendly)",
      priority: 2,
      active: true,
      sort_order: 4,
    },
    {
      title: "2-minute calm or breath (mindset rep)",
      notes: "Stress skill compounds — tiny is enough",
      priority: 2,
      active: true,
      sort_order: 5,
    },
    {
      title: "One-line win or journal note",
      notes: "Compound awareness — what went well?",
      priority: 3,
      active: true,
      sort_order: 6,
    },
  ];
  return seeds.map((s) => ({
    ...s,
    id: uid(),
    created_at: now,
  }));
}

/** Optional starter habits when planting longevity / mindset goals */
export function suggestHabitsForCategory(
  category?: string | null
): { title: string; notes?: string; priority: HabitPriority }[] {
  if (category === "longevity") {
    return [
      {
        title: "Morning outdoor light 5–10 min",
        notes: "Circadian anchor",
        priority: 1,
      },
      {
        title: "Zone-2 or easy walk 20+ min",
        notes: "Aerobic base",
        priority: 2,
      },
      {
        title: "Strength or bodyweight 2× this week (log today if training day)",
        notes: "Muscle is healthspan",
        priority: 2,
      },
    ];
  }
  if (category === "mindset") {
    return [
      {
        title: "Mindset practice 2–10 min",
        notes: "Sit, breath, or mindful walk",
        priority: 1,
      },
      {
        title: "One-line reframe or gratitude",
        notes: "What can I control?",
        priority: 2,
      },
    ];
  }
  return [];
}

export function addSuggestedHabitsForCategory(category?: string | null) {
  const suggestions = suggestHabitsForCategory(category);
  if (!suggestions.length) return [];
  const existing = listHabits().map((h) => h.title.toLowerCase());
  const added = [];
  for (const s of suggestions) {
    if (existing.includes(s.title.toLowerCase())) continue;
    added.push(addHabit(s));
  }
  return added;
}

function loadHabitsRaw(): Habit[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Habit[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveHabits(habits: Habit[]) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  window.dispatchEvent(new CustomEvent("goal-garden:habits"));
}

function loadDays(): Record<string, HabitDayState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DAYS_KEY) || "{}") as Record<
      string,
      HabitDayState
    >;
  } catch {
    return {};
  }
}

function saveDays(map: Record<string, HabitDayState>) {
  localStorage.setItem(DAYS_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("goal-garden:habits"));
}

function sortByOrder(habits: Habit[]): Habit[] {
  return [...habits].sort(
    (a, b) =>
      (Number.isFinite(a.sort_order) ? a.sort_order : 0) -
        (Number.isFinite(b.sort_order) ? b.sort_order : 0) ||
      a.priority - b.priority ||
      String(a.created_at || "").localeCompare(String(b.created_at || "")) ||
      a.title.localeCompare(b.title)
  );
}

/**
 * Assign sort_order 0..n-1 in the array's CURRENT order.
 * Do NOT re-sort first — that undoes intentional moves.
 */
function stampOrder(habits: Habit[]): Habit[] {
  return habits.map((h, i) => ({ ...h, sort_order: i }));
}

/** Sort by existing sort_order, then stamp 0..n-1 (for load/normalize only) */
function reindexAll(habits: Habit[]): Habit[] {
  return stampOrder(sortByOrder(habits));
}

export function listHabits(): Habit[] {
  const existing = loadHabitsRaw();
  if (!existing || existing.length === 0) {
    const seeded = reindexAll(defaultHabits());
    if (typeof window !== "undefined") saveHabits(seeded);
    return seeded;
  }
  return sortByOrder(existing);
}

export function activeHabitsSorted(): Habit[] {
  return listHabits().filter((h) => h.active);
}

/**
 * Groups for display headers, but each group's habits keep global sort_order.
 * Prefer `activeHabitsSorted()` for a single sortable list.
 */
export function habitsByPriority(): {
  priority: HabitPriority;
  habits: Habit[];
}[] {
  const active = activeHabitsSorted();
  return ([1, 2, 3] as HabitPriority[]).map((priority) => ({
    priority,
    habits: active.filter((h) => h.priority === priority),
  }));
}

export function addHabit(input: {
  title: string;
  notes?: string;
  priority?: HabitPriority;
}): Habit {
  const habits = listHabits();
  const habit: Habit = {
    id: uid(),
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    priority: input.priority ?? 2,
    active: true,
    created_at: new Date().toISOString(),
    sort_order: habits.length,
  };
  habits.push(habit);
  saveHabits(habits);
  return habit;
}

export function updateHabit(id: string, patch: Partial<Habit>) {
  const habits = listHabits().map((h) =>
    h.id === id ? { ...h, ...patch, id: h.id } : h
  );
  saveHabits(habits);
}

export function deleteHabit(id: string) {
  saveHabits(listHabits().filter((h) => h.id !== id));
}

export function setHabitPriority(id: string, priority: HabitPriority) {
  const habits = listHabits();
  saveHabits(
    reindexAll(
      habits.map((x) => (x.id === id ? { ...x, priority } : x))
    )
  );
}

/**
 * Move habit up/down in the full active list (left-column order).
 * Priority labels stay; only display order changes.
 *
 * Critical: after swap, stamp order from the new array order — never
 * re-sort by old sort_order (that undoes the swap).
 */
export function moveHabit(id: string, direction: "up" | "down"): boolean {
  const all = listHabits();
  const active = sortByOrder(all.filter((x) => x.active));

  const idx = active.findIndex((x) => x.id === id);
  if (idx < 0) return false;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= active.length) return false;

  const reordered = active.slice();
  [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];

  const inactive = all.filter((x) => !x.active);
  // Stamp in new visual order — do not call reindexAll (it sorts by old order)
  const next = stampOrder([...reordered, ...inactive]);
  saveHabits(next);
  return true;
}

/** Move habit to absolute index in the active list (0-based) */
export function moveHabitToIndex(id: string, newIndex: number): boolean {
  const all = listHabits();
  const active = sortByOrder(all.filter((x) => x.active));
  const idx = active.findIndex((x) => x.id === id);
  if (idx < 0) return false;
  const clamped = Math.max(0, Math.min(active.length - 1, newIndex));
  if (clamped === idx) return false;
  const reordered = active.slice();
  const [item] = reordered.splice(idx, 1);
  reordered.splice(clamped, 0, item);
  const inactive = all.filter((x) => !x.active);
  saveHabits(stampOrder([...reordered, ...inactive]));
  return true;
}

export function getHabitDay(date = todayISO()): HabitDayState {
  const map = loadDays();
  if (map[date]) return map[date];
  return { date, done: {} };
}

export function isHabitDone(habitId: string, date = todayISO()): boolean {
  return Boolean(getHabitDay(date).done[habitId]);
}

export function toggleHabitDone(habitId: string, date = todayISO()): HabitDayState {
  const map = loadDays();
  const day = map[date] ?? { date, done: {} };
  const nextDone = { ...day.done, [habitId]: !day.done[habitId] };
  if (!nextDone[habitId]) delete nextDone[habitId];
  map[date] = { date, done: nextDone };
  saveDays(map);
  return map[date];
}

export function setHabitDone(
  habitId: string,
  completed: boolean,
  date = todayISO()
) {
  const map = loadDays();
  const day = map[date] ?? { date, done: {} };
  const done = { ...day.done };
  if (completed) done[habitId] = true;
  else delete done[habitId];
  map[date] = { date, done };
  saveDays(map);
  return map[date];
}

export type HabitDayStats = {
  total: number;
  completed: number;
  p1Total: number;
  p1Done: number;
  pct: number;
  /** All P1 must-dos complete */
  mustsCleared: boolean;
  compoundScore: number;
  streakDays: number;
};

export function habitDayStats(date = todayISO()): HabitDayStats {
  const habits = activeHabitsSorted();
  const day = getHabitDay(date);
  const p1 = habits.filter((h) => h.priority === 1);
  const completed = habits.filter((h) => day.done[h.id]).length;
  const p1Done = p1.filter((h) => day.done[h.id]).length;
  const total = habits.length;
  return {
    total,
    completed,
    p1Total: p1.length,
    p1Done,
    pct: total ? Math.round((completed / total) * 100) : 0,
    mustsCleared: p1.length === 0 || p1Done === p1.length,
    compoundScore: compoundCompletions(),
    streakDays: habitStreakDays(),
  };
}

/** Total checkmarks ever (compounding count) */
export function compoundCompletions(): number {
  const map = loadDays();
  let n = 0;
  for (const day of Object.values(map)) {
    n += Object.values(day.done).filter(Boolean).length;
  }
  return n;
}

/** Consecutive days (ending today or yesterday) where all P1 musts were done */
export function habitStreakDays(): number {
  const habits = activeHabitsSorted().filter((h) => h.priority === 1);
  if (!habits.length) {
    // fall back to any habit completion streak
    return anyHabitStreak();
  }
  const map = loadDays();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 90; i++) {
    const iso = d.toISOString().slice(0, 10);
    const day = map[iso];
    const allP1 =
      day && habits.every((h) => day.done[h.id]);
    if (allP1) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      // today incomplete — don't break past streak yet
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function anyHabitStreak(): number {
  const habits = activeHabitsSorted();
  if (!habits.length) return 0;
  const map = loadDays();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 90; i++) {
    const iso = d.toISOString().slice(0, 10);
    const day = map[iso];
    const any = day && habits.some((h) => day.done[h.id]);
    if (any) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function resetDefaultHabits() {
  saveHabits(defaultHabits());
}
