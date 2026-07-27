"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, TreePine } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { demoSignIn, demoSignUp, isDemoMode } from "@/lib/local-store";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured() || isDemoMode()) {
        if (mode === "signup") {
          demoSignUp(email, password, name);
        } else {
          demoSignIn(email, password);
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const supabase = createClient();
      if (mode === "signup") {
        const { error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (signError) throw signError;
        setInfo(
          "Check your email to confirm if required — otherwise you're ready."
        );
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signError) throw signError;
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
          {mode === "login" ? "Welcome back" : "Start growing"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "login"
            ? "Sign in to tend your goals."
            : "Create an account and plant your first big goal."}
        </p>
        {(!isSupabaseConfigured() || isDemoMode()) && (
          <p className="badge-soft mx-auto mt-3">
            Demo mode · any email & password works
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        </div>

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
            <Link href="/signup" className="font-medium text-accent hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already growing?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
