import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  isStripeConfigured,
  premiumProductDescription,
  premiumUnitAmountCents,
  siteOrigin,
} from "@/lib/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_NAME, PREMIUM_PRICE_USD } from "@/lib/pricing";

/**
 * Stripe tax code — Software as a service (SaaS), personal use.
 * Required when Managed Payments is on (default for many new Stripe accounts).
 * @see https://docs.stripe.com/tax/tax-codes
 */
const PREMIUM_TAX_CODE = "txcd_10103001";

/**
 * POST /api/stripe/checkout
 * Subscription Checkout at $7.99/mo. Secret key stays on the server.
 *
 * Always uses inline price_data + tax_code so Managed Payments is satisfied
 * even if a Dashboard product has no tax code.
 */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Set STRIPE_SECRET_KEY in Netlify environment variables.",
        },
        { status: 503 }
      );
    }

    let email: string | undefined;
    let userId: string | undefined;

    try {
      const body = (await request.json().catch(() => ({}))) as {
        email?: string;
      };
      if (body.email) email = String(body.email).trim().toLowerCase();
    } catch {
      /* empty body ok */
    }

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        email = email || user.email || undefined;
      }
    } catch {
      /* demo / no supabase */
    }

    const stripe = getStripe();
    const origin = siteOrigin();

    // Always build product inline with tax_code — do NOT use a bare price_ id
    // that may lack tax_code (Managed Payments will reject it).
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          unit_amount: premiumUnitAmountCents(), // 799 = $7.99
          recurring: { interval: "month" },
          product_data: {
            name: "Goal Garden Premium",
            description: premiumProductDescription(),
            tax_code: PREMIUM_TAX_CODE,
            metadata: {
              product: "goal_garden_premium",
              company: COMPANY_NAME,
            },
          },
        },
        quantity: 1,
      },
    ];

    // Use a plain object so managed_payments is always sent (SDK types may omit it).
    const sessionParams = {
      mode: "subscription" as const,
      line_items: lineItems,
      success_url: `${origin}/dashboard/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/settings?checkout=cancel`,
      customer_email: email,
      client_reference_id: userId || undefined,
      metadata: {
        product: "goal_garden_premium",
        company: COMPANY_NAME,
        price_usd: String(PREMIUM_PRICE_USD),
        supabase_user_id: userId || "",
      },
      subscription_data: {
        metadata: {
          product: "goal_garden_premium",
          supabase_user_id: userId || "",
        },
      },
      allow_promotion_codes: true,
      // Disable Managed Payments for this session if tax_code still fails on some accounts
      managed_payments: {
        enabled: false,
      },
    };

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(
        sessionParams as Stripe.Checkout.SessionCreateParams
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Second attempt: tax_code only (no managed_payments field) if API rejects unknown params
      if (msg.includes("managed_payments") || msg.includes("unknown")) {
        const { managed_payments: _mp, ...withoutManaged } = sessionParams;
        session = await stripe.checkout.sessions.create(
          withoutManaged as Stripe.Checkout.SessionCreateParams
        );
      } else if (msg.includes("tax code") || msg.includes("Managed Payments")) {
        // Third attempt: digital goods tax code variant
        const alt = structuredClone(sessionParams);
        const pd = alt.line_items[0]?.price_data?.product_data as {
          tax_code?: string;
        };
        if (pd) pd.tax_code = "txcd_10000000"; // General - Electronically Supplied Services
        session = await stripe.checkout.sessions.create(
          alt as Stripe.Checkout.SessionCreateParams
        );
      } else {
        throw err;
      }
    }

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not start checkout",
      },
      { status: 500 }
    );
  }
}
