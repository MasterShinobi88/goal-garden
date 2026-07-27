"use client";

import { useEffect } from "react";
import { loadGoals, loadPrefs } from "@/lib/local-store";
import {
  maybeSendGentleReminders,
  notifPrefsFromUser,
} from "@/lib/notifications";

/**
 * Runs quietly in the dashboard shell.
 * Only fires OS notifications when opted in — max ~1/day.
 */
export function GentleReminders() {
  useEffect(() => {
    function tick() {
      const prefs = notifPrefsFromUser(loadPrefs());
      if (!prefs.enabled) return;
      maybeSendGentleReminders(loadGoals(), prefs);
    }

    // Check shortly after load, then hourly while the tab lives
    const t0 = window.setTimeout(tick, 4000);
    const interval = window.setInterval(tick, 60 * 60 * 1000);

    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
