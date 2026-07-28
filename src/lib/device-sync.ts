/**
 * Sync habits + sleep (and related device data) through profiles.preferences.
 * Goals/tasks use the goals tables; this covers local-only modules so mobile
 * and desktop browser stay aligned after sign-in.
 */
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/runtime-mode";

const HABITS_KEY = "goal-garden:habits";
const DAYS_KEY = "goal-garden:habit-days";
const SLEEP_SCHEDULE_KEY = "goal-garden:sleep-schedule";
const SLEEP_LOG_KEY = "goal-garden:sleep-log";

export type GardenLocalBlob = {
  habits?: unknown;
  habitDays?: unknown;
  sleepSchedule?: unknown;
  sleepLog?: unknown;
  updatedAt?: string;
};

function cloudOn() {
  return isSupabaseConfigured() && !isDemoMode();
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function collectGardenLocal(): GardenLocalBlob {
  const updatedAt = new Date().toISOString();
  try {
    localStorage.setItem("goal-garden:garden-local-updated", updatedAt);
  } catch {
    /* ignore */
  }
  return {
    habits: readJson(HABITS_KEY),
    habitDays: readJson(DAYS_KEY),
    sleepSchedule: readJson(SLEEP_SCHEDULE_KEY),
    sleepLog: readJson(SLEEP_LOG_KEY),
    updatedAt,
  };
}

export function applyGardenLocal(blob: GardenLocalBlob | null | undefined) {
  if (!blob || typeof window === "undefined") return;
  if (blob.habits != null) writeJson(HABITS_KEY, blob.habits);
  if (blob.habitDays != null) writeJson(DAYS_KEY, blob.habitDays);
  if (blob.sleepSchedule != null)
    writeJson(SLEEP_SCHEDULE_KEY, blob.sleepSchedule);
  if (blob.sleepLog != null) writeJson(SLEEP_LOG_KEY, blob.sleepLog);
  try {
    window.dispatchEvent(new CustomEvent("goal-garden:habits"));
    window.dispatchEvent(new CustomEvent("goal-garden:sleep"));
  } catch {
    /* ignore */
  }
}

/** Read full preferences row (may include garden_local + theme keys). */
export async function fetchProfilePreferences(): Promise<Record<
  string,
  unknown
> | null> {
  if (!cloudOn() || typeof window === "undefined") return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data?.preferences) return null;
    return data.preferences as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function writeProfilePreferences(
  next: Record<string, unknown>
): Promise<void> {
  if (!cloudOn() || typeof window === "undefined") return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        preferences: next,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } catch (e) {
    console.error("[device-sync] write preferences failed", e);
  }
}

/** Push habits/sleep to account without wiping theme prefs. */
export async function pushGardenLocalToCloud(): Promise<void> {
  if (!cloudOn()) return;
  const existing = (await fetchProfilePreferences()) || {};
  const garden_local = collectGardenLocal();
  await writeProfilePreferences({
    ...existing,
    garden_local,
  });
}

/**
 * Merge cloud garden_local onto this device.
 * - Cloud empty → upload this device
 * - Local empty → download cloud
 * - Both have data → newer updatedAt wins
 */
export async function pullGardenLocalFromCloud(): Promise<boolean> {
  if (!cloudOn()) return false;
  const existing = await fetchProfilePreferences();
  if (!existing) {
    await pushGardenLocalToCloud();
    return false;
  }
  const cloud = existing.garden_local as GardenLocalBlob | undefined;
  const localHabits = readJson(HABITS_KEY);
  const localEmpty =
    !localHabits ||
    (Array.isArray(localHabits) && (localHabits as unknown[]).length === 0);
  const cloudHabits = cloud?.habits;
  const cloudHas =
    Array.isArray(cloudHabits) && (cloudHabits as unknown[]).length > 0;

  if (!cloud || !cloudHas) {
    if (!localEmpty) await pushGardenLocalToCloud();
    return false;
  }

  if (localEmpty) {
    applyGardenLocal(cloud);
    return true;
  }

  const cloudTime = Date.parse(cloud.updatedAt || "") || 0;
  const localMeta = readJson("goal-garden:garden-local-updated") as
    | string
    | null;
  const localTime = Date.parse(localMeta || "") || 0;

  if (cloudTime >= localTime) {
    applyGardenLocal(cloud);
    try {
      localStorage.setItem(
        "goal-garden:garden-local-updated",
        cloud.updatedAt || new Date().toISOString()
      );
    } catch {
      /* ignore */
    }
    return true;
  }

  await pushGardenLocalToCloud();
  return false;
}

/** Debounced push after habit/sleep edits */
let pushTimer: ReturnType<typeof setTimeout> | null = null;
export function schedulePushGardenLocal() {
  if (!cloudOn() || typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushGardenLocalToCloud();
  }, 600);
}
