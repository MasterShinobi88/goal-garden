"use client";

/**
 * Receives a Supabase session from bambootide.org account handoff
 * (hash fragment with access_token + refresh_token) and stores it
 * in Goal Garden's auth client, then redirects to the garden.
 */
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function parseHash(hash: string) {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  return {
    access_token: params.get("access_token") || "",
    refresh_token: params.get("refresh_token") || "",
    type: params.get("type") || "",
  };
}

export default function AuthHandoffPage() {
  const [message, setMessage] = useState("Connecting your BambooTide account…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isSupabaseConfigured()) {
        setMessage("Goal Garden is not connected to Supabase yet.");
        return;
      }
      const { access_token, refresh_token } = parseHash(
        typeof window !== "undefined" ? window.location.hash : ""
      );
      if (!access_token || !refresh_token) {
        setMessage("Missing session. Return to bambootide.org/account and try again.");
        return;
      }
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) throw error;
        // Clear tokens from URL bar
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "/auth/handoff");
        }
        if (!cancelled) {
          setMessage("Signed in — opening your garden…");
          window.location.replace("/");
        }
      } catch (e) {
        if (!cancelled) {
          setMessage(
            e instanceof Error
              ? e.message
              : "Could not complete handoff. Try signing in on Goal Garden directly."
          );
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm tracking-widest uppercase text-emerald-800/70 font-semibold mb-3">
        BambooTide · Goal Garden
      </p>
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">Account handoff</h1>
      <p className="text-stone-600 text-sm max-w-md">{message}</p>
      <a
        href="https://bambootide.org/account"
        className="mt-8 text-sm font-semibold text-emerald-800 underline underline-offset-2"
      >
        Back to BambooTide account
      </a>
    </main>
  );
}
