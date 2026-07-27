/**
 * Goal Garden commercial pricing + BambooTide mission
 *
 * Premium is a recurring subscription so we can keep building and funding cleanup.
 * 10% of net proceeds support ocean & river cleanup (same mission as BambooTide).
 */

export const PREMIUM_PRICE_USD = 7.99;

/** Display: $7.99/mo */
export const PREMIUM_PRICE_LABEL = `$${PREMIUM_PRICE_USD.toFixed(2)}`;

export const PREMIUM_INTERVAL: "month" | "year" = "month";

export const PREMIUM_INTERVAL_LABEL =
  PREMIUM_INTERVAL === "month" ? "/month" : "/year";

/** Full price line for buttons and cards */
export const PREMIUM_PRICE_FULL = `${PREMIUM_PRICE_LABEL}${PREMIUM_INTERVAL_LABEL}`;

export const PREMIUM_BILLING_NOTE =
  "Subscription · cancel anytime · billed monthly";

/** Share of net proceeds to cleanup (marketing + Settings). */
export const CLEANUP_PROCEEDS_PERCENT = 10;

export const CLEANUP_MISSION =
  "10% of net proceeds support ocean and river cleanup.";

export const COMPANY_NAME = "BambooTide";

export const COMPANY_URL = "https://bambootide.org";

export const COMPANY_APPS_URL = "https://bambootide.org/apps/goal-garden/";

export const COMPANY_TAGLINE =
  "Eco essentials, free tools, and a cleaner tide — by BambooTide.";

/**
 * Optional static Payment Link (Dashboard → Payment links).
 * Prefer server Checkout via POST /api/stripe/checkout (STRIPE_SECRET_KEY).
 */
export function getPremiumCheckoutUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_PREMIUM_CHECKOUT_URL?.trim();
  if (url && /^https:\/\//i.test(url)) return url;
  return null;
}

/** Client-visible: secret key is never exposed; we only know if Checkout API is intended. */
export function prefersStripeCheckoutApi(): boolean {
  return process.env.NEXT_PUBLIC_STRIPE_CHECKOUT === "true";
}

export function premiumMarketingUrl() {
  return (
    process.env.NEXT_PUBLIC_MARKETING_URL?.trim() || COMPANY_APPS_URL
  );
}

export function companyLogoUrl() {
  // Hosted on the marketing site so the app always shows the official mark
  return (
    process.env.NEXT_PUBLIC_BAMBOOTIDE_LOGO_URL?.trim() ||
    "https://bambootide.org/Assets/Logo.png"
  );
}

export function companyLogoDarkUrl() {
  return (
    process.env.NEXT_PUBLIC_BAMBOOTIDE_LOGO_DARK_URL?.trim() ||
    "https://bambootide.org/Assets/DarkmodeLogo.png"
  );
}
