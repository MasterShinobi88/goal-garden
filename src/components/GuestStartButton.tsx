"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { demoSignIn, isDemoMode } from "@/lib/local-store";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  label?: string;
  ghost?: boolean;
};

/**
 * One-click entry for the public browser app (localStorage demo session).
 * No account, no Supabase required when demo mode is on.
 */
export function GuestStartButton({
  className,
  label = "Open free in browser",
  ghost = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function start() {
    setLoading(true);
    try {
      // Public browser builds use demo/localStorage (see WEB.md).
      // Still safe if Supabase is later configured with DEMO_MODE=true.
      void isDemoMode();
      demoSignIn("guest@bambootide.org", "guest");
      router.push("/dashboard");
    } catch {
      router.push("/signup");
    }
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={loading}
      className={cn(
        ghost ? "btn-ghost px-5" : "btn-primary px-5",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
