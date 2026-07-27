import { NextResponse } from "next/server";
import {
  getStripe,
  isStripeConfigured,
  premiumProductDescription,
  premiumUnitAmountCents,
  siteOrigin,
} from "@/lib/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_NAME, PREMIUM_PRICE_USD } from "@/lib/pricing";

/** SaaS – personal use (eligible for Managed Payments). */
const PREMIUM_TAX_CODE = "txcd_10103001";

/**
 * POST /api/stripe/checkout
 *
 * Uses Stripe raw form encoding so tax_code + managed_payments are never
 * stripped by SDK typing. Required for accounts with Managed Payments default on.
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
      /* empty ok */
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
      /* no supabase */
    }

    const stripe = getStripe();
    const origin = siteOrigin();
    const unitAmount = String(premiumUnitAmountCents()); // "799"

    // Form-style body — matches what Stripe logs; tax_code is explicit.
    // managed_payments[enabled]=false satisfies accounts that still require tax codes.
    const form: Record<string, string> = {
      mode: "subscription",
      success_url: `${origin}/dashboard/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/settings?checkout=cancel`,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": unitAmount,
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][product_data][name]": "Goal Garden Premium",
      "line_items[0][price_data][product_data][description]":
        premiumProductDescription(),
      "line_items[0][price_data][product_data][tax_code]": PREMIUM_TAX_CODE,
      "metadata[product]": "goal_garden_premium",
      "metadata[company]": COMPANY_NAME,
      "metadata[price_usd]": String(PREMIUM_PRICE_USD),
      "metadata[supabase_user_id]": userId || "",
      "subscription_data[metadata][product]": "goal_garden_premium",
      "subscription_data[metadata][supabase_user_id]": userId || "",
      allow_promotion_codes: "true",
      "managed_payments[enabled]": "false",
    };

    if (email) {
      form.customer_email = email;
    }
    if (userId) {
      form.client_reference_id = userId;
    }

    async function createSession(body: Record<string, string>) {
      // rawRequest guarantees every field is sent to Stripe exactly as specified
      return stripe.rawRequest("POST", "/v1/checkout/sessions", body);
    }

    let session: {
      id?: string;
      url?: string | null;
      error?: { message?: string };
    };

    try {
      session = (await createSession(form)) as typeof session;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Retry without managed_payments if the API rejects that param name
      if (msg.includes("managed_payments")) {
        const { "managed_payments[enabled]": _drop, ...rest } = form;
        session = (await createSession(rest)) as typeof session;
      } else if (msg.includes("tax code") || msg.includes("tax_code")) {
        // Alternate electronically-supplied-services code
        const retry = { ...form };
        retry["line_items[0][price_data][product_data][tax_code]"] =
          "txcd_10000000";
        session = (await createSession(retry)) as typeof session;
      } else {
        throw err;
      }
    }

    if (!session?.url) {
      return NextResponse.json(
        {
          error:
            (session as { error?: { message?: string } })?.error?.message ||
            "Stripe did not return a checkout URL.",
        },
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
