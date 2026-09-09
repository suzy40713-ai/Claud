import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/plans";
import type { Plan } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function planFromPriceId(priceId: string | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_CREATOR) return "creator";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return null;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();

  async function syncSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.supabase_user_id;
    const item = subscription.items.data[0];
    const priceId = item?.price.id;
    const plan = planFromPriceId(priceId);

    if (!userId || !plan) {
      console.warn("Webhook: missing user id or unrecognized price", { userId, priceId });
      return;
    }

    const planConfig = PLANS[plan];
    const isActive = ["active", "trialing"].includes(subscription.status);

    await supabase
      .from("profiles")
      .update({
        plan: isActive ? plan : "free",
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        search_credits: isActive ? planConfig.searchCreditsPerMonth : PLANS.free.searchCreditsPerMonth,
        idea_credits_per_search: isActive ? planConfig.ideasPerSearch : PLANS.free.ideasPerSearch,
        credits_reset_at: new Date(item.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await syncSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            plan: "free",
            stripe_subscription_status: "canceled",
            search_credits: PLANS.free.searchCreditsPerMonth,
            idea_credits_per_search: PLANS.free.ideasPerSearch,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionRef = invoice.parent?.subscription_details?.subscription;
      if (subscriptionRef) {
        const subscriptionId =
          typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
