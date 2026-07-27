"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check, Volume2 } from "lucide-react";
import type { UserPreferences } from "@/lib/types";
import { loadPrefs, savePrefs } from "@/lib/local-store";
import {
  notifPrefsFromUser,
  permissionState,
  requestNotificationPermission,
  sendPreviewNotification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<UserPreferences>(loadPrefs());
  const [perm, setPerm] = useState(permissionState());
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(loadPrefs());
    setPerm(permissionState());
  }, []);

  const n = notifPrefsFromUser(prefs);

  function update(patch: Partial<UserPreferences>) {
    setPrefs((p) => ({ ...p, ...patch }));
    setSaved(false);
    setMsg(null);
  }

  async function enable() {
    const result = await requestNotificationPermission();
    setPerm(result);
    if (result === "granted") {
      update({ notifications_enabled: true });
      const next = { ...loadPrefs(), ...prefs, notifications_enabled: true };
      savePrefs(next);
      setPrefs(next);
      setSaved(true);
      setMsg(
        "Enabled. You’ll get at most one quiet daily reminder (and an optional Sunday check-in) — never a stack of ads."
      );
    } else if (result === "denied") {
      setMsg(
        "Browser blocked notifications. In Chrome/Edge: site settings → Notifications → Allow for localhost."
      );
    } else if (result === "unsupported") {
      setMsg("This browser doesn’t support notifications.");
    }
  }

  function save() {
    savePrefs(prefs);
    setSaved(true);
    setMsg("Reminder preferences saved.");
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-start gap-2">
        <Bell className="mt-0.5 h-5 w-5 text-accent" />
        <div>
          <h2 className="font-semibold">Gentle reminders</h2>
          <p className="text-xs text-muted">
            Optional desktop/browser notifications — designed to{" "}
            <strong className="text-foreground">not</strong> feel like spam.
            Max one digest per day, silent, auto-dismiss, same slot replaced
            (not stacked). Off by default.
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 rounded-xl border border-border bg-black/20 px-3 py-2.5 text-xs text-muted">
        <li>• No sticky “ad” banners that force clicking off</li>
        <li>• Quiet hours (default 9pm–8am) — we stay silent</li>
        <li>• Skips the day if you have nothing open</li>
        <li>• Phone: works best if you “Install app” / keep browser allowed</li>
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px]",
            n.enabled && perm === "granted"
              ? "bg-accent/15 text-accent"
              : "bg-white/5 text-muted"
          )}
        >
          {perm === "granted" && n.enabled
            ? "Reminders on"
            : perm === "denied"
              ? "Blocked by browser"
              : "Reminders off"}
        </span>
        {perm !== "granted" ? (
          <button type="button" className="btn-primary text-sm" onClick={() => void enable()}>
            <Bell className="h-4 w-4" />
            Enable gently
          </button>
        ) : (
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => {
              update({ notifications_enabled: !prefs.notifications_enabled });
            }}
          >
            {prefs.notifications_enabled ? (
              <>
                <BellOff className="h-4 w-4" /> Turn off
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" /> Turn on
              </>
            )}
          </button>
        )}
        {perm === "granted" && (
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => {
              const ok = sendPreviewNotification();
              setMsg(
                ok
                  ? "Preview sent — check your system notification area (not an in-app popup ad)."
                  : "Could not show preview."
              );
            }}
          >
            <Volume2 className="h-4 w-4" />
            Preview once
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={prefs.notifications_daily !== false}
            onChange={(e) =>
              update({ notifications_daily: e.target.checked })
            }
          />
          Daily digest (max 1/day)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={prefs.notifications_weekly !== false}
            onChange={(e) =>
              update({ notifications_weekly: e.target.checked })
            }
          />
          Sunday review ping (optional)
        </label>
        <div>
          <label className="mb-1 block text-xs text-muted">
            Earliest digest hour
          </label>
          <input
            type="number"
            min={6}
            max={20}
            className="input-field"
            value={prefs.notifications_hour ?? 9}
            onChange={(e) =>
              update({ notifications_hour: Number(e.target.value) })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Quiet from</label>
            <input
              type="number"
              min={0}
              max={23}
              className="input-field"
              value={prefs.notifications_quiet_start ?? 21}
              onChange={(e) =>
                update({
                  notifications_quiet_start: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Quiet until</label>
            <input
              type="number"
              min={0}
              max={23}
              className="input-field"
              value={prefs.notifications_quiet_end ?? 8}
              onChange={(e) =>
                update({ notifications_quiet_end: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {msg && (
        <p className="rounded-lg border border-border bg-white/5 px-3 py-2 text-xs text-muted">
          {msg}
        </p>
      )}

      <button type="button" className="btn-primary text-sm" onClick={save}>
        {saved ? <Check className="h-4 w-4" /> : null}
        Save reminder settings
      </button>
    </section>
  );
}
