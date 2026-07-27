/**
 * Goal Garden Premium license (local first, Lemon Squeezy-ready later)
 *
 * Free tier: full local tracking; AI uses mock or user BYOK
 * Premium: unlocked AI server features, higher goal limits, badge
 *
 * Offline keys (v1 launch):
 *   GG-PREMIUM-LAUNCH
 *   GG-PREMIUM-BAMBOO
 *   GG-DEV-UNLOCK
 *
 * Later: validate against Lemon Squeezy and cache signed entitlement.
 */

"use client";

import { isDesktopApp } from "./desktop";

const LICENSE_KEY = "goal-garden:license";
const FREE_MAX_ACTIVE_GOALS = 3;

export type LicenseState = {
  key: string;
  activatedAt: string;
  tier: "premium";
  source: "offline" | "store";
};

/** Known offline unlock codes for launch / press / your own use */
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

/**
 * Activate a license key offline (v1).
 * Returns { ok, error? }
 */
export function activateLicense(rawKey: string): {
  ok: boolean;
  error?: string;
  license?: LicenseState;
} {
  const key = normalizeKey(rawKey);
  if (!key) return { ok: false, error: "Enter a license key." };

  // Offline launch keys
  if (OFFLINE_PREMIUM_KEYS.has(key)) {
    const license: LicenseState = {
      key,
      activatedAt: new Date().toISOString(),
      tier: "premium",
      source: "offline",
    };
    localStorage.setItem(LICENSE_KEY, JSON.stringify(license));
    return { ok: true, license };
  }

  // Future: GG-LS-… store keys validated online
  if (key.startsWith("GG-LS-") || key.startsWith("GG-")) {
    return {
      ok: false,
      error:
        "That key format needs online activation (coming soon). Use a launch key or contact hello@bambootide.org.",
    };
  }

  return {
    ok: false,
    error: "Invalid license key. Check the code from your purchase email.",
  };
}

export function freeMaxActiveGoals() {
  return FREE_MAX_ACTIVE_GOALS;
}

/** Free: max N active (non-archived) goals. Premium: unlimited. */
export function canCreateAnotherGoal(activeGoalCount: number): {
  allowed: boolean;
  reason?: string;
} {
  if (hasPremium()) return { allowed: true };
  if (activeGoalCount < FREE_MAX_ACTIVE_GOALS) return { allowed: true };
  return {
    allowed: false,
    reason: `Free includes ${FREE_MAX_ACTIVE_GOALS} active goals. Upgrade to Premium for unlimited gardens.`,
  };
}

export function premiumBenefits(): string[] {
  return [
    "Unlimited active goals",
    "Priority AI planning & coach (with your keys or server keys)",
    "Premium badge in the garden",
    "Early access to desktop updates",
  ];
}

export function isDesktopLocalBuild() {
  return isDesktopApp();
}
