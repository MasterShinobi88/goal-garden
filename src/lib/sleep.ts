/**
 * Sleep schedule + daily sleep log.
 * Track bedtime/wake vs target so rest compounds with habits.
 */
import { todayISO } from "./utils";

export type SleepSchedule = {
  /** "22:30" 24h local */
  target_bedtime: string;
  /** "06:30" */
  target_wake: string;
  /** Desired hours (e.g. 8) */
  target_hours: number;
  /** Soft reminder minutes before bed */
  wind_down_minutes: number;
  enabled: boolean;
};

export type SleepLogEntry = {
  date: string;
  /** Actual bed time "23:15" */
  bed_time: string | null;
  /** Actual wake "07:00" */
  wake_time: string | null;
  /** Computed or manual hours */
  hours: number | null;
  quality: 1 | 2 | 3 | 4 | 5 | null;
  notes?: string;
};

const SCHEDULE_KEY = "goal-garden:sleep-schedule";
const LOG_KEY = "goal-garden:sleep-log";

export const DEFAULT_SLEEP_SCHEDULE: SleepSchedule = {
  target_bedtime: "22:30",
  target_wake: "06:30",
  target_hours: 8,
  wind_down_minutes: 30,
  enabled: true,
};

function emit() {
  window.dispatchEvent(new CustomEvent("goal-garden:sleep"));
  void import("./device-sync")
    .then((m) => m.schedulePushGardenLocal())
    .catch(() => undefined);
}

export function getSleepSchedule(): SleepSchedule {
  if (typeof window === "undefined") return DEFAULT_SLEEP_SCHEDULE;
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (!raw) return DEFAULT_SLEEP_SCHEDULE;
    return { ...DEFAULT_SLEEP_SCHEDULE, ...(JSON.parse(raw) as SleepSchedule) };
  } catch {
    return DEFAULT_SLEEP_SCHEDULE;
  }
}

export function saveSleepSchedule(patch: Partial<SleepSchedule>): SleepSchedule {
  const next = { ...getSleepSchedule(), ...patch };
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(next));
  emit();
  return next;
}

function allSleepLogs(): Record<string, SleepLogEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "{}") as Record<
      string,
      SleepLogEntry
    >;
  } catch {
    return {};
  }
}

function saveLogs(map: Record<string, SleepLogEntry>) {
  localStorage.setItem(LOG_KEY, JSON.stringify(map));
  emit();
}

export function getSleepLog(date = todayISO()): SleepLogEntry | null {
  return allSleepLogs()[date] ?? null;
}

export function ensureSleepLog(date = todayISO()): SleepLogEntry {
  const map = allSleepLogs();
  if (map[date]) return map[date];
  const entry: SleepLogEntry = {
    date,
    bed_time: null,
    wake_time: null,
    hours: null,
    quality: null,
  };
  map[date] = entry;
  saveLogs(map);
  return entry;
}

export function updateSleepLog(
  patch: Partial<SleepLogEntry>,
  date = todayISO()
): SleepLogEntry {
  const map = allSleepLogs();
  const current = map[date] ?? ensureSleepLog(date);
  let hours = patch.hours !== undefined ? patch.hours : current.hours;
  const bed = patch.bed_time !== undefined ? patch.bed_time : current.bed_time;
  const wake =
    patch.wake_time !== undefined ? patch.wake_time : current.wake_time;
  if (
    (patch.bed_time !== undefined || patch.wake_time !== undefined) &&
    bed &&
    wake
  ) {
    hours = hoursBetween(bed, wake);
  }
  map[date] = {
    ...current,
    ...patch,
    date,
    bed_time: bed,
    wake_time: wake,
    hours,
  };
  saveLogs(map);
  return map[date];
}

/** Hours between bed (night) and wake (next morning). Bed after wake → overnight. */
export function hoursBetween(bed: string, wake: string): number {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let bedM = bh * 60 + bm;
  let wakeM = wh * 60 + wm;
  if (wakeM <= bedM) wakeM += 24 * 60;
  const mins = wakeM - bedM;
  return Math.round((mins / 60) * 10) / 10;
}

export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const am = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

export type SleepStatus = {
  schedule: SleepSchedule;
  log: SleepLogEntry | null;
  /** Minutes until target bedtime from now (can be negative if past) */
  minutesToBed: number;
  minutesToWindDown: number;
  inWindDown: boolean;
  pastBedtime: boolean;
  hoursLastNight: number | null;
  onTrackHours: boolean | null;
  avgHours7d: number | null;
  sleepStreak: number;
};

export function minutesUntilTime(hhmm: string, from = new Date()): number {
  const [h, m] = hhmm.split(":").map(Number);
  const target = new Date(from);
  target.setHours(h, m, 0, 0);
  let diff = (target.getTime() - from.getTime()) / 60000;
  // If bedtime already passed today, show time until tonight's... already past = negative
  // For "time until bed" if negative and |diff| large, could mean next day:
  if (diff < -12 * 60) diff += 24 * 60; // weird clock skew
  if (diff < 0 && Math.abs(diff) < 12 * 60) {
    // past tonight's target — next is tomorrow
    // keep negative to show "past"
  }
  if (diff > 18 * 60) {
    // morning: bed is tonight
    // target was set to today morning-ish? if target_bedtime 22:30 and now is 8am, target is today 22:30, positive
  }
  // Fix: if target is earlier in the clock today and we're after midnight before bed, OK
  // If we're after bedtime, add 24h for "next bedtime" display optionally
  return Math.round(diff);
}

export function minutesUntilBedtime(
  schedule: SleepSchedule,
  from = new Date()
): number {
  const [h, m] = schedule.target_bedtime.split(":").map(Number);
  const target = new Date(from);
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= from.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return Math.round((target.getTime() - from.getTime()) / 60000);
}

export function getSleepStatus(from = new Date()): SleepStatus {
  const schedule = getSleepSchedule();
  const log = getSleepLog(todayISO());
  const minutesToBed = minutesUntilBedtime(schedule, from);
  const minutesToWindDown = minutesToBed - schedule.wind_down_minutes;
  const inWindDown =
    schedule.enabled &&
    minutesToWindDown <= 0 &&
    minutesToBed > 0;
  const pastBedtime = schedule.enabled && minutesToBed > 23 * 60; // shouldn't happen with next-bed calc

  // Past bedtime: if now is after tonight's bed and before wake — simpler check
  const [bh, bm] = schedule.target_bedtime.split(":").map(Number);
  const bedTonight = new Date(from);
  bedTonight.setHours(bh, bm, 0, 0);
  const pastTonightBed = from.getTime() > bedTonight.getTime();

  const hoursLastNight = log?.hours ?? null;
  const onTrackHours =
    hoursLastNight != null
      ? hoursLastNight >= schedule.target_hours - 0.5
      : null;

  return {
    schedule,
    log,
    minutesToBed,
    minutesToWindDown,
    inWindDown,
    pastBedtime: pastTonightBed && minutesToBed > 12 * 60 ? false : pastTonightBed && minutesToBed > 20 * 60,
    hoursLastNight,
    onTrackHours,
    avgHours7d: averageHours(7),
    sleepStreak: sleepOnTrackStreak(),
  };
}

function averageHours(days: number): number | null {
  const map = allSleepLogs();
  const vals: number[] = [];
  const d = new Date();
  for (let i = 0; i < days; i++) {
    const iso = d.toISOString().slice(0, 10);
    const h = map[iso]?.hours;
    if (h != null) vals.push(h);
    d.setDate(d.getDate() - 1);
  }
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function sleepOnTrackStreak(): number {
  const schedule = getSleepSchedule();
  const map = allSleepLogs();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const iso = d.toISOString().slice(0, 10);
    const h = map[iso]?.hours;
    const ok = h != null && h >= schedule.target_hours - 0.5;
    if (ok) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function formatCountdown(minutes: number): string {
  if (minutes < 0) {
    const past = Math.abs(minutes);
    const h = Math.floor(past / 60);
    const m = past % 60;
    if (h <= 0) return `${m}m past bed`;
    return `${h}h ${m}m past bed`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
