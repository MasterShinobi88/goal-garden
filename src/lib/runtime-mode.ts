/**
 * Server-safe runtime flags (no "use client").
 * Safe to import from Server Components and API routes.
 */

/**
 * Demo mode = fake local accounts (any email/password works) + localStorage-only goals.
 *
 * Rules:
 * - NEXT_PUBLIC_DEMO_MODE=true  → always demo (local testing only)
 * - NEXT_PUBLIC_DEMO_MODE=false → never demo (production web / Netlify / cloud desktop)
 * - DEMO unset + Supabase set   → real accounts (desktop + web)
 * - DEMO unset + no Supabase    → demo (so local builds without env still work)
 * - NEXT_PUBLIC_DESKTOP alone no longer forces offline demo — desktop can sync when
 *   Supabase is configured and DEMO_MODE is not forced on.
 */
export function isDemoMode(): boolean {
  const flag = process.env.NEXT_PUBLIC_DEMO_MODE?.trim().toLowerCase();

  // Explicit production / cloud: real accounts even on desktop shells
  if (flag === "false" || flag === "0" || flag === "no") {
    return false;
  }

  // Explicit demo (local testing only — never use on garden.bambootide.org)
  if (flag === "true" || flag === "1" || flag === "yes") {
    return true;
  }

  // Unset flag: only demo when Supabase is not configured
  if (!isSupabaseEnvConfigured()) {
    return true;
  }

  return false;
}

/** True when goals/tasks should go to Supabase (not local-only). */
export function usesCloudData(): boolean {
  return isSupabaseEnvConfigured() && !isDemoMode();
}

/** Production expects real sign-up / sign-in (Supabase). */
export function requiresRealAccount(): boolean {
  return !isDemoMode();
}

export function isSupabaseEnvConfigured(): boolean {
  // Lazy import path avoided — keep this file free of client boundaries
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  let url = raw.replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  url = url.replace(/\/rest\/v1.*$/i, "");
  url = url.replace(/\/auth\/v1.*$/i, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      key.length > 20 &&
      !key.includes("your-anon") &&
      url.startsWith("https://")
  );
}
