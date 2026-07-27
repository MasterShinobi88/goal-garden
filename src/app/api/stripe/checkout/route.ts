import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  getStripePriceId,
  isStripeConfigured,
  premiumProductDescription,
  premiumUnitAmountCents,
  siteOrigin,
} from "@/lib/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_NAME, PREMIUM_PRICE_USD } from "@/lib/pricing";

/**
 * Stripe tax code for digitally delivered software / SaaS.
 * Required when Managed Payments is enabled on the account.
 * @see https://docs.stripe.com/tax/tax-codes
 * @see https://docs.stripe.com/payments/managed-payments/how-it-works
 */
const PREMIUM_TAX_CODE = "txcd_10103001"; // Software as a service (SaaS) - personal use

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session in subscription mode ($7.99/mo).
 * Secret key never leaves the server.
 */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Set STRIPE_SECRET_KEY (and optionally STRIPE_PRICE_ID) in Netlify.",
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
    const priceId = getStripePriceId();

    // Prefer Dashboard price when set; otherwise inline $7.99/mo with tax code.
    // Managed Payments requires product tax_code — always set it on price_data.
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Goal Garden Premium",
                description: premiumProductDescription(),
                tax_code: PREMIUM_TAX_CODE,
              },
              unit_amount: premiumUnitAmountCents(), // 799 = $7.99
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
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
      // Avoid Managed Payments tax_code requirement when using a Dashboard price
      // that has no tax code yet. Safe for standard Checkout subscriptions.
      // @see https://docs.stripe.com/payments/managed-payments/how-it-works
      ...( {
        managed_payments: { enabled: false },
      } as Partial<Stripe.Checkout.SessionCreateParams>),
    };

    // If Dashboard price lacks tax_code, Managed Payments still errors —
    // fall back to inline price_data with tax_code.
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (firstErr) {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      if (
        priceId &&
        (msg.includes("tax code") || msg.includes("Managed Payments"))
      ) {
        console.warn(
          "[stripe/checkout] price tax_code missing — retrying with inline price_data"
        );
        session = await stripe.checkout.sessions.create({
          ...sessionParams,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Goal Garden Premium",
                  description: premiumProductDescription(),
                  tax_code: PREMIUM_TAX_CODE,
                },
                unit_amount: premiumUnitAmountCents(),
                recurring: { interval: "month" },
              },
              quantity: 1,
            },
          ],
        });
      } else {
        throw firstErr;
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
