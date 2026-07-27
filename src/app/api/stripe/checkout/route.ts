import { NextResponse } from "next/server";
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
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session in subscription mode ($7.99/mo).
 * Secret key never leaves the server.
 *
 * Body (optional): { email?: string }
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

    // Attach signed-in user when Supabase is available
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

    const lineItems: {
      price?: string;
      price_data?: {
        currency: string;
        product_data: { name: string; description: string };
        unit_amount: number;
        recurring: { interval: "month" };
      };
      quantity: number;
    }[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Goal Garden Premium",
                description: premiumProductDescription(),
              },
              unit_amount: premiumUnitAmountCents(), // 799 = $7.99
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
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
    });

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
