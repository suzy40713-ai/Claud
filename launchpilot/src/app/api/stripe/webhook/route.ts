import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/types/database";

function mapStripeStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "unpaid":
      return status;
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "canceled";
  }
}

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (userId && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;

        await admin.from("profiles").update({ plan: "pro" }).eq("id", userId);
        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "pro",
            status: "active",
            stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
            stripe_subscription_id: subscriptionId,
          },
          { onConflict: "user_id" }
        );
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      let resolvedUserId: string | undefined = subscription.metadata?.supabase_user_id;

      if (!resolvedUserId) {
        const { data: existing } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();
        resolvedUserId = existing?.user_id;
      }

      if (!resolvedUserId) break;

      const isActive = subscription.status === "active" || subscription.status === "trialing";
      const plan = event.type === "customer.subscription.deleted" || !isActive ? "free" : "pro";
      const periodEnd = subscription.items.data[0]?.current_period_end;

      await admin.from("profiles").update({ plan }).eq("id", resolvedUserId);
      await admin.from("subscriptions").upsert(
        {
          user_id: resolvedUserId,
          plan,
          status: mapStripeStatus(subscription.status),
          stripe_subscription_id: subscription.id,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        { onConflict: "user_id" }
      );
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
