/**
 * Goal Garden Premium
 *
 * Free: up to 3 active goals, mock/BYOK AI
 * Premium ($7.99/mo subscription): unlimited goals + badge + supports product & cleanup
 *
 * Sources:
 *  - Account (Supabase profile) — works on any device when signed in
 *  - Local key / purchase receipt (desktop or offline cache)
 *  - Launch keys (dev / press only — not sold)
 */

"use client";

import { isDesktopApp } from "./desktop";
import {
  PREMIUM_PRICE_FULL,
  PREMIUM_PRICE_LABEL,
  PREMIUM_PRICE_USD,
} from "./pricing";
import { isDemoMode } from "./local-store";
import { createClient, isSupabaseConfigured } from "./supabase/client";

const LICENSE_KEY = "goal-garden:license";
const FREE_MAX_ACTIVE_GOALS = 3;

export type LicenseState = {
  key: string;
  activatedAt: string;
  tier: "premium";
  source: "offline" | "store" | "account";
};

/** Dev / press only — never sell these as the $7.99 product */
const OFFLINE_PREMIUM_KEYS = new Set([
  "GG-PREMIUM-LAUNCH",
  "GG-PREMIUM-BAMBOO",
  "GG-DEV-UNLOCK",
]);

function normalizeKey(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function getLicense(): LicenseState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LICENSE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LicenseState;
  } catch {
    return null;
  }
}

export function hasPremium(): boolean {
  const lic = getLicense();
  return !!lic && lic.tier === "premium";
}

export function clearLicense() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LICENSE_KEY);
}

function saveLocalLicense(license: LicenseState) {
  localStorage.setItem(LICENSE_KEY, JSON.stringify(license));
}

/**
 * Activate a license key (offline launch keys or store codes).
 */
export function activateLicense(rawKey: string): {
  ok: boolean;
  error?: string;
  license?: LicenseState;
} {
  const key = normalizeKey(rawKey);
  if (!key) return { ok: false, error: "Enter a license key." };

  if (OFFLINE_PREMIUM_KEYS.has(key)) {
    const license: LicenseState = {
      key,
      activatedAt: new Date().toISOString(),
      tier: "premium",
      source: "offline",
    };
    saveLocalLicense(license);
    void persistPremiumToAccount(true, "offline_key");
    return { ok: true, license };
  }

  if (key.startsWith("GG-LS-") || key.startsWith("GG-")) {
    return {
      ok: false,
      error:
        "Store keys activate after purchase. Use Buy Premium, or contact hello@bambootide.org with your receipt.",
    };
  }

  return {
    ok: false,
    error: "Invalid license key. Check your purchase email or contact support.",
  };
}

/** Mirror Premium onto Supabase profile so it follows the account. */
export async function persistPremiumToAccount(
  premium: boolean,
  source = "store"
): Promise<void> {
  if (!isSupabaseConfigured() || isDemoMode()) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        premium,
        premium_source: premium ? source : null,
        premium_activated_at: premium ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } catch {
    /* non-fatal — local license still works */
  }
}

/**
 * Load Premium from signed-in account (any device).
 * Call on login / app boot when using Supabase.
 */
export async function refreshPremiumFromAccount(): Promise<boolean> {
  if (!isSupabaseConfigured() || isDemoMode()) return hasPremium();
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return hasPremium();

    const { data, error } = await supabase
      .from("profiles")
      .select("premium, premium_activated_at, premium_source")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return hasPremium();

    if (data.premium) {
      saveLocalLicense({
        key: "ACCOUNT",
        activatedAt: data.premium_activated_at || new Date().toISOString(),
        tier: "premium",
        source: "account",
      });
      return true;
    }

    // Account is free — drop account-sourced local cache only
    const local = getLicense();
    if (local?.source === "account") clearLicense();
    return hasPremium();
  } catch {
    return hasPremium();
  }
}

export function freeMaxActiveGoals() {
  return FREE_MAX_ACTIVE_GOALS;
}

export function canCreateAnotherGoal(activeGoalCount: number): {
  allowed: boolean;
  reason?: string;
} {
  if (hasPremium()) return { allowed: true };
  if (activeGoalCount < FREE_MAX_ACTIVE_GOALS) return { allowed: true };
  return {
    allowed: false,
    reason: `Free includes ${FREE_MAX_ACTIVE_GOALS} active goals. Upgrade to Premium (${PREMIUM_PRICE_FULL}) for unlimited gardens.`,
  };
}

export function premiumBenefits(): string[] {
  return [
    "Unlimited active goals",
    "Premium badge in the garden",
    "Priority AI planning perks (with your keys or server keys)",
    "Syncs with your account on any device",
    "Funds ongoing support & new features",
    "10% of net proceeds → ocean & river cleanup",
  ];
}

export function premiumPriceLabel() {
  return PREMIUM_PRICE_FULL;
}

export function premiumPriceUsd() {
  return PREMIUM_PRICE_USD;
}

export function isDesktopLocalBuild() {
  return isDesktopApp();
}
