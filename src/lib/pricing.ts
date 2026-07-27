/**
 * Goal Garden commercial pricing (public)
 */

export const PREMIUM_PRICE_USD = 7.99;

export const PREMIUM_PRICE_LABEL = `$${PREMIUM_PRICE_USD.toFixed(2)}`;

/** One-time Premium unlock (not a subscription). */
export const PREMIUM_BILLING_NOTE =
  "One-time purchase · unlocks Premium on your account";

/**
 * Checkout URL for Lemon Squeezy / Stripe Payment Link.
 * Set NEXT_PUBLIC_PREMIUM_CHECKOUT_URL in Netlify when the product is live.
 */
export function getPremiumCheckoutUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_PREMIUM_CHECKOUT_URL?.trim();
  if (url && /^https:\/\//i.test(url)) return url;
  return null;
}

export function premiumMarketingUrl() {
  return (
    process.env.NEXT_PUBLIC_MARKETING_URL?.trim() ||
    "https://bambootide.org/apps/goal-garden/"
  );
}
