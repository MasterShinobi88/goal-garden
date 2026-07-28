/**
 * User preferences — local (per account) + Supabase profiles.preferences.
 * Theme and settings survive refresh and follow the signed-in user.
 */

import type { UserPreferences } from "./types";
import { applyTheme, normalizeTheme, type ThemeMode } from "./theme";
import { isDemoMode } from "./runtime-mode";
import { createClient, isSupabaseConfigured } from "./supabase/client";

const PREFS_LEGACY = "goal-garden:prefs";
const PREFS_PREFIX = "goal-garden:prefs:user:";
const PREFS_USER_META = "goal-garden:prefs-user-id";
const THEME_KEY = "goal-garden:theme";

let activeUserId: string | null = null;

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

function storageKey(userId: string | null): string {
  return userId ? `${PREFS_PREFIX}${userId}` : `${PREFS_PREFIX}guest`;
}

function readRaw(userId: string | null): UserPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const key = storageKey(userId);
    let raw = localStorage.getItem(key);
    // Migrate legacy single-key prefs into guest / first bind
    if (!raw) {
      const legacy = localStorage.getItem(PREFS_LEGACY);
      if (legacy) raw = legacy;
    }
    if (!raw) return null;
    return { ...defaultPrefs(), ...(JSON.parse(raw) as UserPreferences) };
  } catch {
    return null;
  }
}

function writeRaw(userId: string | null, prefs: UserPreferences) {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(prefs);
  localStorage.setItem(storageKey(userId), json);
  // Active session mirror for boot script + ThemeProvider
  localStorage.setItem(PREFS_LEGACY, json);
  try {
    localStorage.setItem(PREFS_USER_META, userId || "guest");
  } catch {
    /* ignore */
  }
  const theme = normalizeTheme(prefs.theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function getActivePrefsUserId(): string | null {
  return activeUserId;
}

/** Call when auth user is known so prefs load/save are scoped per account. */
export function bindPrefsUser(userId: string | null) {
  activeUserId = userId;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_USER_META, userId || "guest");
  } catch {
    /* ignore */
  }
}

export function loadPrefs(): UserPreferences {
  if (typeof window === "undefined") return defaultPrefs();
  return readRaw(activeUserId) || defaultPrefs();
}

/**
 * Persist preferences locally (per user) and optionally sync to cloud.
 * Always updates theme class + storage keys so refresh keeps the choice.
 */
export function savePrefs(
  prefs: UserPreferences,
  opts?: { syncCloud?: boolean; applyAppearance?: boolean }
) {
  const next = { ...defaultPrefs(), ...prefs };
  next.theme = normalizeTheme(next.theme);
  writeRaw(activeUserId, next);

  if (opts?.applyAppearance !== false) {
    applyTheme(next.theme as ThemeMode);
  }

  try {
    window.dispatchEvent(
      new CustomEvent("goal-garden:prefs", { detail: next })
    );
  } catch {
    /* ignore */
  }

  if (opts?.syncCloud !== false) {
    void pushPrefsToCloud(next);
  }
}

/** Resolve theme without letting default "dark" wipe an explicit light choice. */
export function resolveTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const direct = localStorage.getItem(THEME_KEY);
    if (direct === "light" || direct === "dark") return direct;
    const prefs = loadPrefs();
    if (prefs.theme === "light" || prefs.theme === "dark") {
      return prefs.theme;
    }
  } catch {
    /* ignore */
  }
  return "dark";
}

export async function pushPrefsToCloud(prefs: UserPreferences): Promise<void> {
  if (!isSupabaseConfigured() || isDemoMode()) return;
  if (typeof window === "undefined") return;
  try {
    const { fetchProfilePreferences, writeProfilePreferences, collectGardenLocal } =
      await import("./device-sync");
    const existing = (await fetchProfilePreferences()) || {};
    const garden_local =
      (existing.garden_local as object | undefined) || collectGardenLocal();
    const payload = {
      ...existing,
      ...prefs,
      theme: normalizeTheme(prefs.theme),
      garden_local,
    };
    await writeProfilePreferences(payload);
  } catch {
    /* non-fatal — local still works offline */
  }
}

export async function pullPrefsFromCloud(): Promise<UserPreferences | null> {
  if (!isSupabaseConfigured() || isDemoMode()) return null;
  if (typeof window === "undefined") return null;
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
    const cloud = data.preferences as UserPreferences;
    if (!cloud || typeof cloud !== "object") return null;
    return { ...defaultPrefs(), ...cloud };
  } catch {
    return null;
  }
}

/**
 * Bind user, merge cloud + local prefs, apply theme.
 * Cloud wins when it has an explicit theme (or any keys); otherwise keep local and upload.
 */
export async function hydratePrefsForUser(
  userId: string | null
): Promise<UserPreferences> {
  bindPrefsUser(userId);
  const local = loadPrefs();

  if (!userId || !isSupabaseConfigured() || isDemoMode()) {
    applyTheme(normalizeTheme(local.theme));
    writeRaw(userId, local);
    return local;
  }

  const cloud = await pullPrefsFromCloud();
  // Always try habits/sleep sync with account
  try {
    const { pullGardenLocalFromCloud } = await import("./device-sync");
    await pullGardenLocalFromCloud();
  } catch {
    /* ignore */
  }

  if (cloud) {
    const cloudHasTheme =
      cloud.theme === "light" || cloud.theme === "dark";
    const localHasTheme =
      local.theme === "light" || local.theme === "dark";
    // Prefer cloud theme when present; otherwise keep local light choice
    const merged: UserPreferences = {
      ...local,
      ...cloud,
      theme: cloudHasTheme
        ? normalizeTheme(cloud.theme)
        : localHasTheme
          ? normalizeTheme(local.theme)
          : "dark",
    };
    // Save local + re-push merged (keeps devices aligned)
    writeRaw(userId, merged);
    applyTheme(normalizeTheme(merged.theme));
    try {
      window.dispatchEvent(
        new CustomEvent("goal-garden:prefs", { detail: merged })
      );
    } catch {
      /* ignore */
    }
    void pushPrefsToCloud(merged);
    return merged;
  }

  // No cloud prefs yet — upload local so other devices get them
  applyTheme(normalizeTheme(local.theme));
  writeRaw(userId, local);
  void pushPrefsToCloud(local);
  try {
    const { pushGardenLocalToCloud } = await import("./device-sync");
    await pushGardenLocalToCloud();
  } catch {
    /* ignore */
  }
  return local;
}
