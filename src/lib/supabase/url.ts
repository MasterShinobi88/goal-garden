/**
 * Normalize NEXT_PUBLIC_SUPABASE_URL so supabase-js never builds bad paths.
 *
 * Common Netlify mistake:
 *   https://xxxx.supabase.co/rest/v1   ← WRONG (causes "Invalid path specified in request URL")
 *   https://xxxx.supabase.co           ← CORRECT
 */
export function normalizeSupabaseUrl(raw: string | undefined | null): string {
  if (!raw) return "";
  let url = raw.trim();
  // strip quotes if pasted with them
  url = url.replace(/^["']|["']$/g, "");
  // remove trailing slash
  url = url.replace(/\/+$/, "");
  // remove accidental API paths
  url = url.replace(/\/rest\/v1.*$/i, "");
  url = url.replace(/\/auth\/v1.*$/i, "");
  url = url.replace(/\/realtime\/v1.*$/i, "");
  url = url.replace(/\/storage\/v1.*$/i, "");
  url = url.replace(/\/functions\/v1.*$/i, "");
  return url;
}

export function isValidSupabaseProjectUrl(url: string): boolean {
  if (!url || url.includes("your-project")) return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      (u.hostname.endsWith(".supabase.co") ||
        u.hostname.endsWith(".supabase.in") ||
        // self-hosted / custom domain still ok if https and no path junk
        u.pathname === "" ||
        u.pathname === "/")
    );
  } catch {
    return false;
  }
}
