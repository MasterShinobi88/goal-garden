import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Email confirmation & magic-link return URL.
 * Supabase redirects here with ?code=… after the user clicks "Confirm your email".
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const { normalizeSupabaseUrl, isValidSupabaseProjectUrl } = await import(
      "@/lib/supabase/url"
    );
    const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (url && key && isValidSupabaseProjectUrl(url)) {
      const supabase = createServerClient(url, key, {
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
              /* Server Component boundary */
            }
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          return NextResponse.redirect(new URL(next, origin));
        }
        // Session without confirm should not happen if Confirm email is ON
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL("/login?error=verify_email", origin)
        );
      }
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback", origin)
  );
}
