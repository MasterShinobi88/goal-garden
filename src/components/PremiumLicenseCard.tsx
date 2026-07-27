"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Crown,
  ExternalLink,
  KeyRound,
  Loader2,
  Sparkles,
  Waves,
} from "lucide-react";
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
  const searchParams = useSearchParams();
  const [license, setLicense] = useState<LicenseState | null>(null);
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [desktop, setDesktop] = useState(false);
  const [buying, setBuying] = useState(false);
  const staticCheckout = getPremiumCheckoutUrl();
  const price = PREMIUM_PRICE_FULL;

  useEffect(() => {
    setDesktop(isDesktopApp());
    void refreshPremiumFromAccount().then(() => setLicense(getLicense()));
  }, []);

  // After Stripe redirect: ?checkout=success&session_id=cs_...
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout === "cancel") {
      setMsg({ type: "err", text: "Checkout canceled — no charge." });
      return;
    }
    if (checkout !== "success" || !sessionId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (cancelled) return;
        if (res.ok && data.ok) {
          localStorage.setItem(
            "goal-garden:license",
            JSON.stringify({
              key: "STRIPE",
              activatedAt: new Date().toISOString(),
              tier: "premium",
              source: "store",
            } satisfies LicenseState)
          );
          await refreshPremiumFromAccount();
          setLicense(getLicense());
          setMsg({
            type: "ok",
            text: "Welcome to Premium — thank you for supporting BambooTide & cleanup.",
          });
        } else {
          setMsg({
            type: "err",
            text: data.error || "Could not confirm payment. Contact support if charged.",
          });
        }
      } catch {
        if (!cancelled) {
          setMsg({
            type: "err",
            text: "Could not confirm payment. Refresh or contact hello@bambootide.org.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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

  async function onBuy() {
    setBuying(true);
    setMsg(null);
    try {
      // Prefer server-side Checkout Session (secret key never in browser)
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      // Fallback: static Payment Link from env
      if (staticCheckout) {
        window.location.href = staticCheckout;
        return;
      }
      setMsg({
        type: "err",
        text:
          data.error ||
          "Checkout isn’t ready yet. Email hello@bambootide.org or set STRIPE_SECRET_KEY on the server.",
      });
      if (!data.error) {
        window.open(premiumMarketingUrl(), "_blank", "noopener,noreferrer");
      }
    } catch {
      if (staticCheckout) {
        window.location.href = staticCheckout;
        return;
      }
      setMsg({
        type: "err",
        text: "Could not start checkout. Try again or contact support.",
      });
    } finally {
      setBuying(false);
    }
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
        <span>
          {CLEANUP_MISSION} Same promise as {COMPANY_NAME}.
        </span>
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
            onClick={() => void onBuy()}
            disabled={buying}
          >
            {buying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Subscribe — {price}
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </>
            )}
          </button>
          <p className="text-[11px] text-muted">{PREMIUM_BILLING_NOTE}</p>
          <p className="text-[11px] text-muted">
            Secure checkout via Stripe. Keys never live in the app code.
          </p>
        </>
      )}

      {premium && license && (
        <div className="rounded-xl border border-border bg-black/20 px-3 py-2 text-xs text-muted">
          <p>
            {license.source === "account" || license.source === "store" ? (
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
