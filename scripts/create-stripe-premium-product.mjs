/**
 * One-time local script: create Goal Garden Premium ($7.99/mo) in Stripe.
 *
 * Usage (PowerShell):
 *   $env:STRIPE_SECRET_KEY="sk_test_..."
 *   node scripts/create-stripe-premium-product.mjs
 *
 * Never commit secret keys. Printed price id → Netlify STRIPE_PRICE_ID.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key || key.includes("{{") || !key.startsWith("sk_")) {
  console.error(
    "Set STRIPE_SECRET_KEY in the environment (sk_test_… or sk_live_…)."
  );
  console.error("See https://dashboard.stripe.com/apikeys");
  process.exit(1);
}

const stripe = new Stripe(key);

const product = await stripe.products.create({
  name: "Goal Garden Premium",
  description:
    "Monthly Premium for Goal Garden by BambooTide. Unlimited goals, account sync, ongoing support. 10% of net proceeds support ocean and river cleanup. Cancel anytime.",
  // Required when Managed Payments is enabled on the Stripe account
  // Software as a service (SaaS) — personal use
  tax_code: "txcd_10103001",
  metadata: {
    product: "goal_garden_premium",
    company: "BambooTide",
  },
  default_price_data: {
    unit_amount: 799, // $7.99 — NOT 1000 ($10)
    currency: "usd",
    recurring: {
      interval: "month",
    },
  },
});

const priceId =
  typeof product.default_price === "string"
    ? product.default_price
    : product.default_price?.id;

console.log("\nCreated Goal Garden Premium\n");
console.log("  product id:", product.id);
console.log("  price id:  ", priceId);
console.log("  amount:    $7.99 / month");
console.log("\nAdd to Netlify environment variables:");
console.log("  STRIPE_PRICE_ID=" + priceId);
console.log("  STRIPE_SECRET_KEY=(same key family: test vs live)\n");
