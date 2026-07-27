/**
 * Stripe server helpers — NEVER import this in client components.
 * Secret key only from process.env (Netlify / local .env.local).
 *
 * @see https://docs.stripe.com/keys-best-practices
 */
import Stripe from "stripe";
import {
  CLEANUP_MISSION,
  COMPANY_NAME,
  PREMIUM_PRICE_USD,
} from "./pricing";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it in Netlify env (secret key, sk_live_… or sk_test_…)."
    );
  }
  if (key.includes("{{") || key === "sk_test_..." || key.length < 20) {
    throw new Error("STRIPE_SECRET_KEY looks like a placeholder. Use a real key from the Stripe Dashboard.");
  }
  if (!stripeSingleton) {
    // Use account default API version from the Stripe SDK (never hardcode secret keys).
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(key && !key.includes("{{") && key.startsWith("sk_"));
}

/** $7.99 → 799 cents */
export function premiumUnitAmountCents(): number {
  return Math.round(PREMIUM_PRICE_USD * 100);
}

export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.URL?.replace(/\/$/, "") || // Netlify
    "http://localhost:3000"
  );
}

/**
 * Prefer a pre-created Price id (Dashboard).
 * If missing, Checkout uses inline price_data (no product create on every request).
 */
export function getStripePriceId(): string | null {
  const id = process.env.STRIPE_PRICE_ID?.trim();
  if (id && id.startsWith("price_")) return id;
  return null;
}

export function premiumProductDescription(): string {
  return (
    `Goal Garden Premium by ${COMPANY_NAME}. Unlimited goals, account sync, ongoing support. ` +
    CLEANUP_MISSION
  );
}
