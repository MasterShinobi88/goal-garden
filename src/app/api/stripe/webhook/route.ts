import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe-server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import type Stripe from "stripe";

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook
 * Configure in Stripe Dashboard → Developers → Webhooks:
 *   URL: https://your-domain/api/stripe/webhook
 *   Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 *
 * Env: STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!whSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Webhook secret not set" }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!serviceKey || !supabaseUrl) {
    console.warn("[stripe/webhook] Supabase service role not set — event accepted but not applied");
    return NextResponse.json({ received: true, applied: false });
  }

  const admin = createSupabaseAdmin(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function setPremium(opts: {
    userId?: string | null;
    email?: string | null;
    premium: boolean;
    source?: string;
  }) {
    const payload = {
      premium: opts.premium,
      premium_source: opts.premium ? opts.source || "stripe_subscription" : null,
      premium_activated_at: opts.premium ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    if (opts.userId) {
      await admin.from("profiles").update(payload).eq("id", opts.userId);
    } else if (opts.email) {
      await admin.from("profiles").update(payload).eq("email", opts.email);
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await setPremium({
            userId: session.client_reference_id || session.metadata?.supabase_user_id,
            email: session.customer_details?.email || session.customer_email,
            premium: true,
            source: "stripe_subscription",
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const active =
          sub.status === "active" ||
          sub.status === "trialing" ||
          sub.status === "past_due";
        await setPremium({
          userId: sub.metadata?.supabase_user_id,
          email: null,
          premium: active,
          source: "stripe_subscription",
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await setPremium({
          userId: sub.metadata?.supabase_user_id,
          email: null,
          premium: false,
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, applied: true });
}
