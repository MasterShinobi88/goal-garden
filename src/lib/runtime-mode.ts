/**
 * Server-safe runtime flags (no "use client").
 * Safe to import from Server Components and API routes.
 */

export function isDemoMode(): boolean {
  // Explicit force (local / Netlify DEMO only)
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;

  // Desktop builds are offline-first
  if (process.env.NEXT_PUBLIC_DESKTOP === "true") return true;

  // Web without Supabase → demo so CI/build still works
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("your-project")) return true;

  return false;
}

/** True when browser app expects real accounts (sign up / sign in). */
export function requiresRealAccount(): boolean {
  return !isDemoMode();
}

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")
  );
}
