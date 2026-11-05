import { afterAll, describe, expect, it } from "vitest";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { invoice, organization } from "@/db/schema";
import { effectivePlan } from "@/domain/billing/plans";
import { handleStripeEvent } from "@/server/billing/service";
import { makeOrg } from "./factory";

afterAll(() => pg.end());

// Client hors ligne : seules les fonctions locales (vérification de signature) sont utilisées.
const stripe = new Stripe("sk_test_booksync_tests_hors_ligne");
let seq = 0;

function subscription(
  orgId: string,
  customer: string,
  price: string,
  status: string,
  extra: Record<string, unknown> = {},
) {
  return {
    id: `sub_${orgId.slice(0, 8)}`,
    object: "subscription",
    customer,
    status,
    cancel_at_period_end: false,
    metadata: { organizationId: orgId },
    items: {
      data: [
        {
          id: "si_1",
          price: { id: price },
          current_period_end: 1_900_000_000,
          current_period_start: 1_897_000_000,
        },
      ],
    },
    ...extra,
  };
}
function event(type: string, object: unknown) {
  return {
    id: `evt_${Date.now()}_${seq++}`,
    object: "event",
    type,
    data: { object },
  } as unknown as Stripe.Event;
}

describe("Stripe Billing (webhooks)", () => {
  it("abonnement Pro créé → forfait Pro actif avec date de renouvellement", async () => {
    const ctx = await makeOrg();
    const sub = subscription(ctx.organization.id, `cus_${seq}`, "price_test_pro", "active");
    expect(await handleStripeEvent(event("customer.subscription.created", sub), stripe)).toBe(true);
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organization.id));
    expect(org.plan).toBe("pro");
    expect(org.subscriptionStatus).toBe("active");
    expect(org.stripeSubscriptionId).toBe(sub.id);
    expect(org.currentPeriodEnd?.getTime()).toBe(1_900_000_000_000);
    expect(effectivePlan(org.plan, org.subscriptionStatus).limits.members).toBe(10);
  });

  it("changement d'offre, résiliation programmée puis fin d'abonnement → retour à Free", async () => {
    const ctx = await makeOrg();
    const cus = `cus_x${seq}`;
    await handleStripeEvent(
      event(
        "customer.subscription.created",
        subscription(ctx.organization.id, cus, "price_test_pro", "active"),
      ),
      stripe,
    );
    await handleStripeEvent(
      event(
        "customer.subscription.updated",
        subscription(ctx.organization.id, cus, "price_test_starter", "active"),
      ),
      stripe,
    );
    let [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organization.id));
    expect(org.plan).toBe("starter");

    await handleStripeEvent(
      event(
        "customer.subscription.updated",
        subscription(ctx.organization.id, cus, "price_test_starter", "active", {
          cancel_at_period_end: true,
        }),
      ),
      stripe,
    );
    [org] = await db.select().from(organization).where(eq(organization.id, ctx.organization.id));
    expect(org.cancelAtPeriodEnd).toBe(true);
    expect(org.plan).toBe("starter");

    await handleStripeEvent(
      event(
        "customer.subscription.deleted",
        subscription(ctx.organization.id, cus, "price_test_starter", "canceled"),
      ),
      stripe,
    );
    [org] = await db.select().from(organization).where(eq(organization.id, ctx.organization.id));
    expect(org.plan).toBe("free");
    expect(org.stripeSubscriptionId).toBeNull();
  });

  it("paiement en retard : forfait conservé ; impayé : retour à Free", async () => {
    const ctx = await makeOrg();
    const cus = `cus_p${seq}`;
    await handleStripeEvent(
      event(
        "customer.subscription.updated",
        subscription(ctx.organization.id, cus, "price_test_pro", "past_due"),
      ),
      stripe,
    );
    let [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organization.id));
    expect(effectivePlan(org.plan, org.subscriptionStatus).id).toBe("pro");
    await handleStripeEvent(
      event(
        "customer.subscription.updated",
        subscription(ctx.organization.id, cus, "price_test_pro", "unpaid"),
      ),
      stripe,
    );
    [org] = await db.select().from(organization).where(eq(organization.id, ctx.organization.id));
    expect(org.plan).toBe("free");
  });

  it("un même événement n'est traité qu'une fois (idempotence)", async () => {
    const ctx = await makeOrg();
    const e = event(
      "customer.subscription.created",
      subscription(ctx.organization.id, `cus_i${seq}`, "price_test_pro", "active"),
    );
    expect(await handleStripeEvent(e, stripe)).toBe(true);
    expect(await handleStripeEvent(e, stripe)).toBe(false);
  });

  it("facture payée enregistrée dans l'historique (mise à jour sans doublon)", async () => {
    const ctx = await makeOrg();
    const cus = `cus_f${seq}`;
    await handleStripeEvent(
      event(
        "customer.subscription.created",
        subscription(ctx.organization.id, cus, "price_test_pro", "active"),
      ),
      stripe,
    );
    const inv = {
      id: `in_${seq}`,
      object: "invoice",
      customer: cus,
      number: "BS-0001",
      status: "open",
      amount_due: 1999,
      amount_paid: 0,
      currency: "eur",
      created: 1_897_000_000,
      hosted_invoice_url: "https://invoice.stripe.com/x",
      invoice_pdf: "https://pay.stripe.com/x.pdf",
      lines: { data: [{ period: { start: 1_897_000_000, end: 1_900_000_000 } }] },
      parent: null,
    };
    await handleStripeEvent(event("invoice.finalized", inv), stripe);
    await handleStripeEvent(
      event("invoice.paid", { ...inv, status: "paid", amount_paid: 1999 }),
      stripe,
    );
    const rows = await db
      .select()
      .from(invoice)
      .where(eq(invoice.organizationId, ctx.organization.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "paid", amountPaidCents: 1999, number: "BS-0001" });
  });

  it("la signature du webhook est vérifiée", async () => {
    const payload = JSON.stringify({
      id: "evt_sig",
      object: "event",
      type: "ping",
      data: { object: {} },
    });
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_test_booksync",
    });
    await expect(
      stripe.webhooks.constructEventAsync(payload, header, "whsec_test_booksync"),
    ).resolves.toMatchObject({ id: "evt_sig" });
    await expect(
      stripe.webhooks.constructEventAsync(payload, header, "whsec_autre_secret"),
    ).rejects.toThrow();
    await expect(
      stripe.webhooks.constructEventAsync(
        payload.replace("ping", "pong"),
        header,
        "whsec_test_booksync",
      ),
    ).rejects.toThrow();
  });

  it("un prix inconnu ne donne jamais accès à un forfait payant", async () => {
    const ctx = await makeOrg();
    await handleStripeEvent(
      event(
        "customer.subscription.created",
        subscription(ctx.organization.id, `cus_u${seq}`, "price_inconnu", "active"),
      ),
      stripe,
    );
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organization.id));
    expect(org.plan).toBe("free");
  });
});
