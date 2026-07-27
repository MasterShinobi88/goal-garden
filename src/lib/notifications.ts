/**
 * Gentle, opt-in reminders — not spammy ad-style toasts.
 *
 * Design principles:
 * - Off by default; explicit permission + settings
 * - At most ONE native OS notification per day (digest), unless weekly review
 * - Quiet hours (default 21:00–08:00) — no pings at night
 * - Reuse the same notification tag so we replace, not stack 12 banners
 * - Transparent / free time on calendar; no aggressive in-app corner ads
 */

import type { GoalWithTree, UserPreferences } from "./types";
import { todayISO } from "./utils";

const LAST_DIGEST_KEY = "goal-garden:last-notif-digest";
const LAST_WEEKLY_KEY = "goal-garden:last-notif-weekly";

export type NotificationPrefs = {
  enabled: boolean;
  /** Morning / afternoon gentle digest of open tasks */
  dailyDigest: boolean;
  hourLocal: number; // 0–23 when to allow first digest
  weeklyReviewPing: boolean;
  quietStart: number; // e.g. 21
  quietEnd: number; // e.g. 8
};

export function defaultNotificationPrefs(): NotificationPrefs {
  return {
    enabled: false,
    dailyDigest: true,
    hourLocal: 9,
    weeklyReviewPing: true,
    quietStart: 21,
    quietEnd: 8,
  };
}

export function notifPrefsFromUser(
  prefs: UserPreferences
): NotificationPrefs {
  const d = defaultNotificationPrefs();
  return {
    enabled: Boolean(prefs.notifications_enabled),
    dailyDigest: prefs.notifications_daily !== false,
    hourLocal: prefs.notifications_hour ?? d.hourLocal,
    weeklyReviewPing: prefs.notifications_weekly !== false,
    quietStart: prefs.notifications_quiet_start ?? d.quietStart,
    quietEnd: prefs.notifications_quiet_end ?? d.quietEnd,
  };
}

export function notificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!notificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

function inQuietHours(prefs: NotificationPrefs, now = new Date()): boolean {
  const h = now.getHours();
  const { quietStart, quietEnd } = prefs;
  if (quietStart === quietEnd) return false;
  // e.g. 21 → 8 crosses midnight
  if (quietStart > quietEnd) {
    return h >= quietStart || h < quietEnd;
  }
  return h >= quietStart && h < quietEnd;
}

function todayKey() {
  return todayISO();
}

function weekKey() {
  // ISO-ish week id
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return `${d.getFullYear()}-W${week}`;
}

/**
 * Show at most one soft OS notification (bottom-right on Windows is OS-controlled).
 * Uses tag so repeats replace the previous Goal Garden notice instead of stacking.
 */
export function showGentleNotification(opts: {
  title: string;
  body: string;
  tag?: string;
}): boolean {
  if (!notificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      // Same tag replaces previous Goal Garden notice instead of stacking spam
      tag: opts.tag || "goal-garden",
      silent: true,
      requireInteraction: false, // auto-dismiss — not sticky ad behavior
      icon: "/favicon.ico",
    });
    n.onclick = () => {
      window.focus();
      n.close();
      window.location.href = "/dashboard";
    };
    // Auto-close after 8s if browser leaves it open
    window.setTimeout(() => n.close(), 8000);
    return true;
  } catch {
    return false;
  }
}

export function buildDigestBody(goals: GoalWithTree[]): string | null {
  const today = todayISO();
  const open = goals
    .filter((g) => !g.archived)
    .flatMap((g) =>
      g.milestones.flatMap((m) =>
        m.daily_tasks
          .filter((t) => !t.completed && t.scheduled_date === today)
          .map((t) => t.title)
      )
    );

  const overdue = goals
    .filter((g) => !g.archived)
    .flatMap((g) =>
      g.milestones.flatMap((m) =>
        m.daily_tasks.filter((t) => !t.completed && t.scheduled_date < today)
      )
    ).length;

  if (open.length === 0 && overdue === 0) {
    return null; // nothing useful — stay quiet
  }

  const preview = open.slice(0, 2).join(" · ");
  const more = open.length > 2 ? ` (+${open.length - 2} more)` : "";
  const overdueBit =
    overdue > 0 ? ` ${overdue} gentle reschedule candidate(s).` : "";

  if (open.length === 0) {
    return `${overdue} past task(s) can be shifted — no guilt, just a soft nudge when you're ready.`;
  }

  return `Today: ${preview}${more}.${overdueBit} Open Goal Garden when you're free.`;
}

/**
 * Run once when the app is open. Never floods.
 * Call from a layout effect on an interval / focus.
 */
export function maybeSendGentleReminders(
  goals: GoalWithTree[],
  prefs: NotificationPrefs
): { sent: boolean; reason: string } {
  if (!prefs.enabled) return { sent: false, reason: "disabled" };
  if (!notificationSupported())
    return { sent: false, reason: "unsupported" };
  if (Notification.permission !== "granted")
    return { sent: false, reason: "no-permission" };
  if (inQuietHours(prefs)) return { sent: false, reason: "quiet-hours" };

  const now = new Date();
  const hour = now.getHours();

  // Weekly review: Sunday after preferred hour, once per week
  if (prefs.weeklyReviewPing && now.getDay() === 0 && hour >= prefs.hourLocal) {
    const wk = weekKey();
    if (localStorage.getItem(LAST_WEEKLY_KEY) !== wk) {
      const ok = showGentleNotification({
        title: "Goal Garden · Sunday check-in",
        body: "Optional weekly review is ready — only if you want a calm look back. No rush.",
        tag: "goal-garden-weekly",
      });
      if (ok) {
        localStorage.setItem(LAST_WEEKLY_KEY, wk);
        return { sent: true, reason: "weekly" };
      }
    }
  }

  if (!prefs.dailyDigest) return { sent: false, reason: "digest-off" };
  if (hour < prefs.hourLocal) return { sent: false, reason: "before-hour" };

  const day = todayKey();
  if (localStorage.getItem(LAST_DIGEST_KEY) === day) {
    return { sent: false, reason: "already-today" };
  }

  const body = buildDigestBody(goals);
  if (!body) return { sent: false, reason: "nothing-to-say" };

  const ok = showGentleNotification({
    title: "Goal Garden · gentle reminder",
    body,
    tag: "goal-garden-daily",
  });
  if (ok) {
    localStorage.setItem(LAST_DIGEST_KEY, day);
    return { sent: true, reason: "digest" };
  }
  return { sent: false, reason: "show-failed" };
}

/** User-triggered sample so they can preview tone (counts as today's digest if enabled). */
export function sendPreviewNotification(): boolean {
  return showGentleNotification({
    title: "Goal Garden · preview",
    body: "This is how reminders look — quiet, once a day max, never sticky ads. You can turn them off anytime in Settings.",
    tag: "goal-garden-preview",
  });
}
