"use client";

import type { GoalWithTree } from "./types";
import { buildGoalsIcs, countExportableTasks } from "./calendar-ics";
import { todayISO, uid } from "./utils";

const TOKEN_KEY = "goal-garden:calendar-feed-token";
const ENABLED_KEY = "goal-garden:calendar-feed-enabled";
const LAST_SYNC_KEY = "goal-garden:calendar-feed-last-sync";

export function getFeedToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isFeedSyncEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "1";
}

export function ensureFeedToken(): string {
  let t = getFeedToken();
  if (!t) {
    t = uid().replace(/-/g, "");
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export function setFeedSyncEnabled(on: boolean) {
  localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  if (on) ensureFeedToken();
}

export function getLastFeedSync(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function buildFeedUrls(token: string, origin?: string) {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const httpsUrl = `${base}/api/calendar/feed/${token}.ics`;
  // Apple / some clients prefer webcal://
  const webcalUrl = httpsUrl.replace(/^https:/, "webcal:").replace(/^http:/, "webcal:");
  return { httpsUrl, webcalUrl };
}

/** Push latest goals to the server feed (for calendar apps to poll). */
export async function publishCalendarFeed(
  goals: GoalWithTree[],
  options?: { includeCompleted?: boolean; fromToday?: boolean }
): Promise<{ ok: boolean; eventCount: number; error?: string }> {
  const token = ensureFeedToken();
  const includeCompleted = options?.includeCompleted ?? false;
  const fromToday = options?.fromToday ?? true;

  const ics = buildGoalsIcs(goals, {
    includeCompleted,
    fromDate: fromToday ? todayISO() : undefined,
    calendarName: "Goal Garden",
  });
  const eventCount = countExportableTasks(goals, includeCompleted);

  try {
    const res = await fetch("/api/calendar/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ics, eventCount }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        eventCount,
        error: data.error || "Publish failed",
      };
    }
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return { ok: true, eventCount };
  } catch (e) {
    return {
      ok: false,
      eventCount,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

/** Call after goals change when auto-sync is on */
export async function maybeAutoPublishFeed(goals: GoalWithTree[]) {
  if (!isFeedSyncEnabled()) return;
  await publishCalendarFeed(goals, {
    includeCompleted: false,
    fromToday: true,
  });
}
