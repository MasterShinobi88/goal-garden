"use client";

import { useEffect, useState } from "react";
import { Crown, ExternalLink, KeyRound, Sparkles, Waves } from "lucide-react";
import {
  activateLicense,
  clearLicense,
  getLicense,
  hasPremium,
  premiumBenefits,
  refreshPremiumFromAccount,
  type LicenseState,
} from "@/lib/license";
import {
  CLEANUP_MISSION,
  COMPANY_NAME,
  COMPANY_URL,
  getPremiumCheckoutUrl,
  PREMIUM_BILLING_NOTE,
  PREMIUM_PRICE_FULL,
  premiumMarketingUrl,
} from "@/lib/pricing";
import { BambooTideBrand } from "@/components/BambooTideBrand";
import { isDesktopApp } from "@/lib/desktop";
import { cn } from "@/lib/utils";

export function PremiumLicenseCard() {
  const [license, setLicense] = useState<LicenseState | null>(null);
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [desktop, setDesktop] = useState(false);
  const checkout = getPremiumCheckoutUrl();
  const price = PREMIUM_PRICE_FULL;

  useEffect(() => {
    setDesktop(isDesktopApp());
    void refreshPremiumFromAccount().then(() => setLicense(getLicense()));
  }, []);

  function refresh() {
    setLicense(getLicense());
  }

  async function onActivate(e: React.FormEvent) {
    e.preventDefault();
    const res = activateLicense(key);
    if (res.ok) {
      setMsg({
        type: "ok",
        text: "Premium unlocked. Saved on this device and on your account when signed in.",
      });
      setKey("");
      await refreshPremiumFromAccount();
      refresh();
    } else {
      setMsg({ type: "err", text: res.error || "Activation failed." });
    }
  }

  function onClear() {
    clearLicense();
    setMsg({ type: "ok", text: "Local license cache removed." });
    refresh();
  }

  function onBuy() {
    const url = checkout || premiumMarketingUrl();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const premium = hasPremium();

  return (
    <section
      className={cn("card space-y-4 p-5", premium && "ring-1 ring-accent/40")}
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
            {premium
              ? desktop
                ? "Subscription support · thanks for growing with us."
                : "Subscription · follows your signed-in account."
              : `${price} · supports product + cleanup mission.`}
          </p>
        </div>
        {premium ? (
          <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
            Premium
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-foreground ring-1 ring-border">
            {price}
          </span>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-sky-100/90">
        <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
        <span>{CLEANUP_MISSION} Same promise as {COMPANY_NAME}.</span>
      </div>

      {!premium && (
        <>
          <ul className="grid gap-1.5 text-xs text-muted sm:grid-cols-2">
            {premiumBenefits().map((b) => (
              <li key={b} className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="btn-primary w-full text-sm"
            onClick={onBuy}
          >
            Subscribe — {price}
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </button>
          <p className="text-[11px] text-muted">{PREMIUM_BILLING_NOTE}</p>
          {!checkout && (
            <p className="text-[11px] text-muted">
              Checkout link is being connected. Email{" "}
              <a
                className="text-accent hover:underline"
                href="mailto:hello@bambootide.org?subject=Goal%20Garden%20Premium%20subscription"
              >
                hello@bambootide.org
              </a>{" "}
              or use a key from your receipt below.
            </p>
          )}
        </>
      )}

      {premium && license && (
        <div className="rounded-xl border border-border bg-black/20 px-3 py-2 text-xs text-muted">
          <p>
            {license.source === "account" ? (
              <>Premium on your account</>
            ) : (
              <>
                Key ending{" "}
                <code className="text-accent">…{license.key.slice(-8)}</code>
              </>
            )}
          </p>
          <p className="mt-0.5">
            Since {new Date(license.activatedAt).toLocaleDateString()} ·{" "}
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
              placeholder="License key from receipt"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" className="btn-ghost shrink-0 text-sm">
            Activate key
          </button>
        </form>
      ) : (
        <button type="button" className="btn-ghost text-sm" onClick={onClear}>
          Remove local license cache
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

      <div className="border-t border-border/60 pt-3">
        <BambooTideBrand variant="compact" dark />
        <p className="mt-2 text-[10px] text-muted">
          A {COMPANY_NAME} product ·{" "}
          <a
            href={COMPANY_URL}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            bambootide.org
          </a>
        </p>
      </div>
    </section>
  );
}
