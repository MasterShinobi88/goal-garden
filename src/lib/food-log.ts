"use client";

import { todayISO, uid } from "./utils";
import type { MacroTotals } from "./food-db";
import { getDailyLog, updateDailyLog } from "./daily-log";

export type LoggedFood = {
  id: string;
  date: string;
  name: string;
  amountLabel: string;
  macros: MacroTotals;
  source: "db" | "ai" | "manual";
  created_at: string;
};

const KEY = "goal-garden:food-log";

function all(): Record<string, LoggedFood[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<
      string,
      LoggedFood[]
    >;
  } catch {
    return {};
  }
}

function save(map: Record<string, LoggedFood[]>) {
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("goal-garden:food-log"));
}

export function getFoodLog(date = todayISO()): LoggedFood[] {
  return all()[date] ?? [];
}

export function addFoodLogEntry(
  entry: Omit<LoggedFood, "id" | "date" | "created_at"> & { date?: string }
): LoggedFood[] {
  const date = entry.date ?? todayISO();
  const map = all();
  const row: LoggedFood = {
    id: uid(),
    date,
    name: entry.name,
    amountLabel: entry.amountLabel,
    macros: entry.macros,
    source: entry.source,
    created_at: new Date().toISOString(),
  };
  map[date] = [...(map[date] ?? []), row];
  save(map);
  syncKcalToHud(date);
  return map[date];
}

export function removeFoodLogEntry(id: string, date = todayISO()) {
  const map = all();
  map[date] = (map[date] ?? []).filter((x) => x.id !== id);
  save(map);
  syncKcalToHud(date);
  return map[date];
}

export function clearFoodLog(date = todayISO()) {
  const map = all();
  map[date] = [];
  save(map);
  syncKcalToHud(date);
}

export function foodLogTotals(date = todayISO()): MacroTotals {
  const items = getFoodLog(date);
  return items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.macros.kcal,
      protein_g: Math.round((acc.protein_g + i.macros.protein_g) * 10) / 10,
      carbs_g: Math.round((acc.carbs_g + i.macros.carbs_g) * 10) / 10,
      fat_g: Math.round((acc.fat_g + i.macros.fat_g) * 10) / 10,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

/** Push food-log kcal sum into Daily HUD */
export function syncKcalToHud(date = todayISO()) {
  const totals = foodLogTotals(date);
  const existing = getDailyLog(date);
  // Only overwrite kcal_eaten if we have food log entries, or set from log
  const entries = getFoodLog(date);
  if (entries.length === 0) {
    // leave HUD as-is if user typed kcal manually and cleared food
    return;
  }
  updateDailyLog(
    {
      kcal_eaten: totals.kcal,
      notes: existing?.notes,
    },
    date
  );
}
