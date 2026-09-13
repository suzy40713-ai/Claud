import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import { CREDITS_PER_PURCHASE, PLAN_PRICE_CENTS } from "@/lib/credits";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe n'est pas configuré." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing signature");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Pay-per-generation: a single one-time (`mode: "payment"`) Checkout
  // Session per 14,99€ purchase — no subscriptions to track.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "payment") {
      return NextResponse.json({ received: true });
    }

    const userId = session.metadata?.supabase_user_id;
    const credits = Number(session.metadata?.credits) || CREDITS_PER_PURCHASE;

    if (userId) {
      const { error: purchaseError } = await admin.from("credit_purchases").insert({
        user_id: userId,
        stripe_session_id: session.id,
        credits_granted: credits,
        amount_cents: session.amount_total ?? PLAN_PRICE_CENTS,
      });

      // Unique constraint on stripe_session_id makes this idempotent: a
      // duplicate webhook delivery fails the insert and we skip granting
      // credits twice.
      if (!purchaseError) {
        const { data: usage } = await admin
          .from("usage_credits")
          .select("credits_balance")
          .eq("user_id", userId)
          .maybeSingle();

        if (usage) {
          await admin
            .from("usage_credits")
            .update({ credits_balance: usage.credits_balance + credits })
            .eq("user_id", userId);
        } else {
          await admin.from("usage_credits").insert({ user_id: userId, credits_balance: credits });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
