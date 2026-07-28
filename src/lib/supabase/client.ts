import { createBrowserClient } from "@supabase/ssr";
import { isValidSupabaseProjectUrl, normalizeSupabaseUrl } from "./url";

export function isSupabaseConfigured() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key && isValidSupabaseProjectUrl(url) && key.length > 20);
}

export function createClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase env vars missing");
  }
  if (!isValidSupabaseProjectUrl(url)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL looks invalid. Use only https://YOURPROJECT.supabase.co (no /rest/v1)."
    );
  }
  return createBrowserClient(url, key);
}
