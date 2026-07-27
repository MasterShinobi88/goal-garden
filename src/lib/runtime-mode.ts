/**
 * Server-safe runtime flags (no "use client").
 * Safe to import from Server Components and API routes.
 */

/**
 * Demo mode = fake local accounts (any email/password works).
 *
 * Rules:
 * - NEXT_PUBLIC_DEMO_MODE=true  → always demo (local testing only)
 * - NEXT_PUBLIC_DEMO_MODE=false → never demo (production web / Netlify)
 * - NEXT_PUBLIC_DESKTOP=true    → demo-style local storage (Electron offline)
 * - DEMO unset + no Supabase    → demo (so `next build` / local without env still works)
 * - DEMO unset + Supabase set   → real accounts
 */
export function isDemoMode(): boolean {
  const flag = process.env.NEXT_PUBLIC_DEMO_MODE?.trim().toLowerCase();

  // Production web: explicitly off — even if Supabase env is missing (auth will error clearly)
  if (flag === "false" || flag === "0" || flag === "no") {
    return false;
  }

  // Explicit demo
  if (flag === "true" || flag === "1" || flag === "yes") {
    return true;
  }

  // Desktop offline shell
  if (process.env.NEXT_PUBLIC_DESKTOP === "true") {
    return true;
  }

  // Unset flag: only demo when Supabase is not configured
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("your-project")) {
    return true;
  }

  return false;
}

/** Production expects real sign-up / sign-in (Supabase). */
export function requiresRealAccount(): boolean {
  return !isDemoMode();
}

export function isSupabaseEnvConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      key.length > 20 &&
      !key.includes("your-anon")
  );
}
