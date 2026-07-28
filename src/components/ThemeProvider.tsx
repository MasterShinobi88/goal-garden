"use client";

import { useEffect } from "react";
import { loadPrefs } from "@/lib/local-store";
import { applyTheme, normalizeTheme, readStoredTheme } from "@/lib/theme";

/**
 * Keeps <html> theme class in sync with prefs / local storage.
 * Inline script in root layout prevents a flash of the wrong theme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(normalizeTheme(loadPrefs().theme ?? readStoredTheme()));

    function onPrefs() {
      applyTheme(normalizeTheme(loadPrefs().theme ?? "dark"));
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
