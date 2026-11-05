/**
 * Crée (ou retrouve) les produits et prix BookSync dans Stripe — MODE TEST uniquement.
 * Usage : STRIPE_SECRET_KEY=sk_test_... pnpm tsx scripts/stripe-setup.ts [https://votre-domaine/api/stripe/webhook]
 * Affiche les variables à reporter dans Render (STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_WEBHOOK_SECRET).
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith("sk_test_") && process.env.ALLOW_LIVE !== "1") {
  console.error(
    "Refusé : utilisez une clé de TEST (sk_test_…). Pour la production, définissez ALLOW_LIVE=1 en connaissance de cause.",
  );
  process.exit(1);
}
const stripe = new Stripe(key!);

const PLANS = [
  { lookup: "booksync_starter_monthly", name: "BookSync Starter", amount: 999 },
  { lookup: "booksync_pro_monthly", name: "BookSync Pro", amount: 1999 },
];

async function main() {
  const ids: Record<string, string> = {};
  for (const p of PLANS) {
    const existing = await stripe.prices.list({ lookup_keys: [p.lookup], active: true, limit: 1 });
    let price = existing.data[0];
    if (!price) {
      const product = await stripe.products.create({ name: p.name, metadata: { app: "booksync" } });
      price = await stripe.prices.create({
        product: product.id,
        currency: "eur",
        unit_amount: p.amount,
        recurring: { interval: "month" },
        tax_behavior: "inclusive",
        lookup_key: p.lookup,
      });
      console.log(`Créé : ${p.name} → ${price.id}`);
    } else console.log(`Existant : ${p.name} → ${price.id}`);
    ids[p.lookup] = price.id;
  }
  const url = process.argv[2];
  let secret: string | undefined;
  if (url) {
    const wh = await stripe.webhookEndpoints.create({
      url,
      enabled_events: [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.finalized",
        "invoice.paid",
        "invoice.payment_failed",
      ],
      description: "BookSync",
    });
    secret = wh.secret;
  }
  console.log("\nVariables d'environnement :");
  console.log(`STRIPE_PRICE_STARTER=${ids.booksync_starter_monthly}`);
  console.log(`STRIPE_PRICE_PRO=${ids.booksync_pro_monthly}`);
  if (secret) console.log(`STRIPE_WEBHOOK_SECRET=${secret}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
