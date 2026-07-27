import type { User } from "@supabase/supabase-js";

/**
 * Email verification is required for cloud accounts.
 * Demo / desktop local mode does not use Supabase email.
 */
export function isEmailVerified(user: User | null | undefined): boolean {
  if (!user) return false;
  // Supabase sets email_confirmed_at when the user clicks the confirm link
  // (or immediately if "Confirm email" is disabled in the project — we require it ON).
  return Boolean(user.email_confirmed_at);
}

export const VERIFY_EMAIL_MESSAGE =
  "Please verify your email before signing in. Check your inbox (and spam) for the confirmation link from Goal Garden / BambooTide.";

export const SIGNUP_VERIFY_MESSAGE =
  "Account created. We sent a verification link to your email. You must confirm your email before you can sign in — check your inbox and spam folder.";
