"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Lock,
  ShieldCheck,
  TreePine,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  demoSignIn,
  demoSignUp,
  isDemoMode,
} from "@/lib/local-store";
import { isSupabaseEnvConfigured } from "@/lib/runtime-mode";
import { refreshPremiumFromAccount } from "@/lib/license";
import { BambooTideBrand } from "@/components/BambooTideBrand";
import { CLEANUP_MISSION, COMPANY_NAME, PREMIUM_PRICE_FULL } from "@/lib/pricing";

const MIN_PASSWORD = 8;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  // Real cloud auth only when Supabase is configured AND not in demo mode
  const cloudReady = isSupabaseConfigured() && isSupabaseEnvConfigured();
  const demo = isDemoMode() && !cloudReady;
  const productionMissingAuth = !isDemoMode() && !cloudReady;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (productionMissingAuth) {
      setError(
        "Real accounts are not connected yet. Add Supabase URL + anon key in Netlify, then redeploy."
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter a display name.");
      return;
    }

    setLoading(true);

    try {
      // Local / desktop demo only
      if (demo) {
        if (mode === "signup") {
          demoSignUp(cleanEmail, password, name);
        } else {
          demoSignIn(cleanEmail, password);
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (!cloudReady) {
        throw new Error(
          "Accounts are not configured. Contact hello@bambootide.org."
        );
      }

      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: signError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: name.trim() || cleanEmail.split("@")[0],
            },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/dashboard`
                : undefined,
          },
        });
        if (signError) throw signError;

        if (data.session) {
          await refreshPremiumFromAccount();
          router.push("/dashboard");
          router.refresh();
        } else {
          setInfo(
            "Account created. Check your email to confirm, then sign in. Your garden is private to your account."
          );
        }
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signError) {
          if (signError.message.toLowerCase().includes("invalid")) {
            throw new Error("Incorrect email or password.");
          }
          throw signError;
        }
        await refreshPremiumFromAccount();
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md animate-fade-up">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/25 to-teal-700/15 text-accent ring-1 ring-accent/30 shadow-[0_0_48px_rgba(52,211,153,0.15)]">
          <TreePine className="h-7 w-7" />
        </div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/90">
          {COMPANY_NAME}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your garden"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "login"
            ? "Sign in with your email — goals sync on every device."
            : "Real account · private · available anywhere you sign in."}
        </p>

        {demo ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Local demo · not a real account
          </p>
        ) : (
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure login · encrypted password
          </p>
        )}
      </div>

      {productionMissingAuth && (
        <div className="card mb-4 border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="flex items-start gap-2 font-medium">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Cloud accounts not connected
          </p>
          <p className="mt-2 text-xs leading-relaxed text-amber-100/80">
            Add <code className="text-accent">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-accent">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
            Netlify, run <code className="text-accent">supabase/schema.sql</code>{" "}
            in your Supabase project, then redeploy. Until then sign-up is
            disabled so fake logins cannot be created.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card space-y-3.5 border-border/80 p-5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)] sm:p-6"
      >
        {mode === "signup" && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              Display name
            </label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
              autoComplete="name"
              required={!demo}
              disabled={productionMissingAuth}
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Email
          </label>
          <input
            type="email"
            className="input-field"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={productionMissingAuth}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Password
          </label>
          <input
            type="password"
            className="input-field"
            required
            minLength={MIN_PASSWORD}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD} characters`}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            disabled={productionMissingAuth}
          />
        </div>

        {mode === "signup" && !demo && (
          <p className="text-[11px] leading-relaxed text-muted">
            Free includes 3 active goals. Premium is {PREMIUM_PRICE_FULL} —{" "}
            {CLEANUP_MISSION} We store your email and goals securely; we never
            sell your personal data.
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {info}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary mt-1 w-full"
          disabled={loading || productionMissingAuth}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link
              href="/signup"
              className="font-medium text-accent hover:underline"
            >
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already growing?{" "}
            <Link
              href="/login"
              className="font-medium text-accent hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>

      <div className="mt-8 flex flex-col items-center gap-2 border-t border-border/50 pt-6">
        <BambooTideBrand variant="mark" dark />
        <p className="max-w-xs text-center text-[10px] leading-relaxed text-muted">
          A {COMPANY_NAME} product · {CLEANUP_MISSION}
        </p>
      </div>
    </div>
  );
}
