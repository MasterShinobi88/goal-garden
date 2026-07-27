"use client";

import { useEffect, useState } from "react";
import { Crown, KeyRound, Sparkles } from "lucide-react";
import {
  activateLicense,
  clearLicense,
  getLicense,
  hasPremium,
  premiumBenefits,
  type LicenseState,
} from "@/lib/license";
import { isDesktopApp } from "@/lib/desktop";
import { cn } from "@/lib/utils";

export function PremiumLicenseCard() {
  const [license, setLicense] = useState<LicenseState | null>(null);
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    setLicense(getLicense());
    setDesktop(isDesktopApp());
  }, []);

  function refresh() {
    setLicense(getLicense());
  }

  function onActivate(e: React.FormEvent) {
    e.preventDefault();
    const res = activateLicense(key);
    if (res.ok) {
      setMsg({ type: "ok", text: "Premium unlocked on this device." });
      setKey("");
      refresh();
    } else {
      setMsg({ type: "err", text: res.error || "Activation failed." });
    }
  }

  function onClear() {
    clearLicense();
    setMsg({ type: "ok", text: "License removed. Free limits apply." });
    refresh();
  }

  const premium = hasPremium();

  return (
    <section
      className={cn(
        "card space-y-4 p-5",
        premium && "ring-1 ring-accent/40"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
          <Crown className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">
            {premium ? "Premium active" : "Goal Garden Premium"}
          </h2>
          <p className="text-xs text-muted">
            {desktop
              ? "Windows desktop · license unlocks unlimited goals & premium AI perks."
              : "Unlock unlimited gardens and premium AI coaching."}
          </p>
        </div>
        {premium && (
          <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
            Premium
          </span>
        )}
      </div>

      {!premium && (
        <ul className="grid gap-1.5 text-xs text-muted sm:grid-cols-2">
          {premiumBenefits().map((b) => (
            <li key={b} className="flex gap-2">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {premium && license && (
        <div className="rounded-xl border border-border bg-black/20 px-3 py-2 text-xs text-muted">
          <p>
            Key ending{" "}
            <code className="text-accent">
              …{license.key.slice(-8)}
            </code>
          </p>
          <p className="mt-0.5">
            Activated {new Date(license.activatedAt).toLocaleDateString()} ·{" "}
            {license.source}
          </p>
        </div>
      )}

      {!premium ? (
        <form onSubmit={onActivate} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              className="input-field w-full pl-9 font-mono text-sm"
              placeholder="GG-PREMIUM-…"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 text-sm">
            Activate
          </button>
        </form>
      ) : (
        <button type="button" className="btn-ghost text-sm" onClick={onClear}>
          Remove license
        </button>
      )}

      {msg && (
        <p
          className={cn(
            "text-xs",
            msg.type === "ok" ? "text-accent" : "text-red-400"
          )}
        >
          {msg.text}
        </p>
      )}

      <p className="text-[11px] text-muted">
        Buy a license at{" "}
        <span className="text-foreground">bambootide.org/apps/goal-garden</span>{" "}
        (coming soon). Launch keys work offline on this device.
      </p>
    </section>
  );
}
