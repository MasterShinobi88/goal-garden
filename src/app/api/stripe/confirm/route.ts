import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe-server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

/**
 * GET /api/stripe/confirm?session_id=cs_...
 * After Checkout success, verify the session and mark the account Premium.
 */
export async function GET(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    if (!sessionId?.startsWith("cs_")) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== "subscription") {
      return NextResponse.json({ error: "Not a subscription session" }, { status: 400 });
    }

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete" ||
      Boolean(session.subscription);

    if (!paid) {
      return NextResponse.json(
        { ok: false, error: "Payment not complete yet", status: session.status },
        { status: 402 }
      );
    }

    const userId =
      session.client_reference_id ||
      session.metadata?.supabase_user_id ||
      "";
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      undefined;

    // Prefer service role for reliable profile update
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    if (serviceKey && supabaseUrl && !supabaseUrl.includes("your-project")) {
      const admin = createSupabaseAdmin(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      if (userId) {
        await admin
          .from("profiles")
          .update({
            premium: true,
            premium_source: "stripe_subscription",
            premium_activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } else if (email) {
        await admin
          .from("profiles")
          .update({
            premium: true,
            premium_source: "stripe_subscription",
            premium_activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("email", email);
      }
    } else {
      // Fall back to user-scoped update if logged in as the same account
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && (!userId || user.id === userId)) {
          await supabase
            .from("profiles")
            .update({
              premium: true,
              premium_source: "stripe_subscription",
              premium_activated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        }
      } catch {
        /* profile update optional without supabase */
      }
    }

    return NextResponse.json({
      ok: true,
      premium: true,
      email: email || null,
      userId: userId || null,
    });
  } catch (err) {
    console.error("[stripe/confirm]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirm failed" },
      { status: 500 }
    );
  }
}
