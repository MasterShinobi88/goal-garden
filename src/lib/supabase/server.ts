import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isValidSupabaseProjectUrl, normalizeSupabaseUrl } from "./url";

export async function createClient() {
  const cookieStore = await cookies();
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

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — middleware will refresh sessions.
        }
      },
    },
  });
}
