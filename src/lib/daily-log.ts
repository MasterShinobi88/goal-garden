"use client";

import { todayISO } from "./utils";

export type DailyLog = {
  date: string;
  water_glasses: number;
  water_target: number;
  kcal_eaten: number | null;
  kcal_target: number | null;
  movement_done: boolean;
  movement_label: string;
  mood?: "great" | "ok" | "low";
  notes?: string;
};

const LOG_KEY = "goal-garden:daily-logs";

function allLogs(): Record<string, DailyLog> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "{}") as Record<
      string,
      DailyLog
    >;
  } catch {
    return {};
  }
}

function saveAll(logs: Record<string, DailyLog>) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent("goal-garden:daily-log"));
}

export function getDailyLog(date = todayISO()): DailyLog | null {
  return allLogs()[date] ?? null;
}

export function ensureDailyLog(defaults: {
  water_target: number;
  kcal_target: number | null;
  movement_label: string;
}): DailyLog {
  const date = todayISO();
  const logs = allLogs();
  if (logs[date]) {
    // refresh targets if plan changed
    logs[date] = {
      ...logs[date],
      water_target: defaults.water_target || logs[date].water_target,
      kcal_target: defaults.kcal_target ?? logs[date].kcal_target,
      movement_label: defaults.movement_label || logs[date].movement_label,
    };
    saveAll(logs);
    return logs[date];
  }
  const log: DailyLog = {
    date,
    water_glasses: 0,
    water_target: defaults.water_target || 8,
    kcal_eaten: null,
    kcal_target: defaults.kcal_target,
    movement_done: false,
    movement_label: defaults.movement_label || "10-minute walk or stretch",
  };
  logs[date] = log;
  saveAll(logs);
  return log;
}

export function updateDailyLog(patch: Partial<DailyLog>, date = todayISO()) {
  const logs = allLogs();
  const current =
    logs[date] ??
    ({
      date,
      water_glasses: 0,
      water_target: 8,
      kcal_eaten: null,
      kcal_target: null,
      movement_done: false,
      movement_label: "Move for 10 minutes",
    } satisfies DailyLog);
  logs[date] = { ...current, ...patch, date };
  saveAll(logs);
  return logs[date];
}

export function setWaterGlasses(n: number, date = todayISO()) {
  return updateDailyLog(
    { water_glasses: Math.max(0, Math.min(20, n)) },
    date
  );
}

export function toggleMovement(date = todayISO()) {
  const log = getDailyLog(date);
  return updateDailyLog({ movement_done: !log?.movement_done }, date);
}

export function waterStreakDays(): number {
  const logs = allLogs();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const iso = d.toISOString().slice(0, 10);
    const log = logs[iso];
    if (log && log.water_glasses >= log.water_target) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      // today incomplete doesn't break past streak
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
