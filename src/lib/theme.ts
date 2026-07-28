/** Goal Garden appearance — dark (default) or light (BambooTide sand/tide). */

export type ThemeMode = "dark" | "light";

export function normalizeTheme(value: unknown): ThemeMode {
  return value === "light" ? "light" : "dark";
}

/** Apply theme class on <html>. Safe to call from client only. */
export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme === "light" ? "light" : "dark");
  root.style.colorScheme = theme === "light" ? "light" : "dark";
  try {
    localStorage.setItem("goal-garden:theme", theme);
  } catch {
    /* ignore */
  }
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const direct = localStorage.getItem("goal-garden:theme");
    if (direct === "light" || direct === "dark") return direct;
    const raw = localStorage.getItem("goal-garden:prefs");
    if (raw) {
      const prefs = JSON.parse(raw) as { theme?: string };
      return normalizeTheme(prefs.theme);
    }
  } catch {
    /* ignore */
  }
  return "dark";
}
