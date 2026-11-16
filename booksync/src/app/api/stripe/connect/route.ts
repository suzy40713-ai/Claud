import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { stripeEvent } from "@/db/schema";
import { getConnectWebhookSecret, getStripe } from "@/server/billing/stripe";
import { handleDepositEvent } from "@/server/deposit/payment";

/** Webhooks des comptes Stripe connectés (acomptes) : signature vérifiée, traitement idempotent. */
export async function POST(req: Request) {
  await connection();
  const stripe = getStripe();
  const secret = stripe ? await getConnectWebhookSecret() : null;
  if (!stripe || !secret)
    return Response.json({ error: "Paiement en ligne non configuré" }, { status: 503 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Signature manquante" }, { status: 400 });
  const payload = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return Response.json({ error: "Signature invalide" }, { status: 400 });
  }
  const [fresh] = await db
    .insert(stripeEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning();
  if (!fresh) return Response.json({ received: true, duplicate: true });
  try {
    await handleDepositEvent(event, stripe);
    return Response.json({ received: true });
  } catch (error) {
    await db.delete(stripeEvent).where(eq(stripeEvent.id, event.id));
    console.error("[stripe connect] échec du traitement", event.type, event.id, error);
    return Response.json({ error: "Erreur de traitement" }, { status: 500 });
  }
}
