"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, TreePine } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  demoSignIn,
  demoSignUp,
  isDemoMode,
  requiresRealAccount,
} from "@/lib/local-store";
import { refreshPremiumFromAccount } from "@/lib/license";
import { BambooTideBrand } from "@/components/BambooTideBrand";
import { CLEANUP_MISSION, COMPANY_NAME } from "@/lib/pricing";

const MIN_PASSWORD = 8;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const demo = isDemoMode() || !isSupabaseConfigured();
  const real = requiresRealAccount() && isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setLoading(true);

    try {
      // Local demo only (desktop or explicit DEMO_MODE)
      if (demo && !real) {
        if (mode === "signup") {
          demoSignUp(cleanEmail, password, name);
        } else {
          demoSignIn(cleanEmail, password);
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (!isSupabaseConfigured()) {
        throw new Error(
          "Accounts are not configured yet. Please try again later or contact hello@bambootide.org."
        );
      }

      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: signError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: (name || cleanEmail.split("@")[0]).trim(),
            },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/dashboard`
                : undefined,
          },
        });
        if (signError) throw signError;

        // Session present = email confirm off; otherwise ask to confirm
        if (data.session) {
          await refreshPremiumFromAccount();
          router.push("/dashboard");
          router.refresh();
        } else {
          setInfo(
            "Account created. Check your email to confirm, then sign in. Your data is private to your account."
          );
        }
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signError) throw signError;
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-700/10 text-accent ring-1 ring-accent/25 shadow-[0_0_40px_rgba(52,211,153,0.12)]">
          <TreePine className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your garden"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "login"
            ? "Sign in to access your goals on any device."
            : "Real account · goals sync securely with your login."}
        </p>
        {demo && !real ? (
          <p className="badge-soft mx-auto mt-3">
            Local demo · data stays on this device
          </p>
        ) : (
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            Encrypted auth · private to your account
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card space-y-3.5 p-5 sm:p-6">
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
          />
        </div>

        {mode === "signup" && (
          <p className="text-[11px] leading-relaxed text-muted">
            By creating an account you agree we store your email and goal data
            securely to provide the service. We never sell your personal data.
            See{" "}
            <a
              href="https://bambootide.org/contact"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              BambooTide contact
            </a>{" "}
            for privacy questions.
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
          disabled={loading}
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
