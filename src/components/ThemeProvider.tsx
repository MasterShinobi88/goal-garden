"use client";

import { useEffect } from "react";
import { resolveTheme } from "@/lib/prefs";
import { applyTheme } from "@/lib/theme";

/**
 * Keeps <html> theme class in sync with stored prefs.
 * Uses resolveTheme() so an explicit "light" choice is never overwritten
 * by defaultPrefs().theme === "dark" after a refresh.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(resolveTheme());

    function onPrefs() {
      applyTheme(resolveTheme());
    }
    window.addEventListener("goal-garden:prefs", onPrefs);
    window.addEventListener("storage", onPrefs);
    return () => {
      window.removeEventListener("goal-garden:prefs", onPrefs);
      window.removeEventListener("storage", onPrefs);
    };
  }, []);

  return <>{children}</>;
}
