import { afterAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { organization } from "@/db/schema";
import { makeOrg } from "./factory";

// Faux client Stripe : enregistre les paramètres de la page de paiement, aucun appel réseau.
const created: Array<Record<string, unknown>> = [];
const fake = {
  customers: { create: vi.fn(async () => ({ id: `cus_test_${created.length}` })) },
  checkout: {
    sessions: {
      create: vi.fn(async (params: Record<string, unknown>) => {
        created.push(params);
        return { id: "cs_test", url: "https://checkout.stripe.com/c/pay/test" };
      }),
    },
  },
};
vi.mock("@/server/billing/stripe", () => ({
  getStripe: () => fake,
  isBillingConfigured: () => true,
  ensureStripeSetup: async () => {},
  getPriceIds: async () => ({ starter: "price_starter", pro: "price_pro" }),
}));

const { startSubscription } = await import("@/server/billing/service");

afterAll(() => pg.end());

describe("pas d'essai gratuit", () => {
  it("premier abonnement : paiement dès l'abonnement, sans essai", async () => {
    const ctx = await makeOrg();
    const res = await startSubscription(ctx, "starter");
    expect(res).toEqual({ url: "https://checkout.stripe.com/c/pay/test" });
    expect(created.at(-1)).toMatchObject({
      mode: "subscription",
      line_items: [{ price: "price_starter", quantity: 1 }],
    });
    const sub = created.at(-1)!.subscription_data as Record<string, unknown>;
    expect(sub.trial_period_days).toBeUndefined();
  });

  it("entreprise déjà abonnée par le passé : pas de nouvel essai", async () => {
    const ctx = await makeOrg();
    await db
      .update(organization)
      .set({ subscriptionStatus: "canceled", plan: "free" })
      .where(eq(organization.id, ctx.organization.id));
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organization.id));
    await startSubscription({ ...ctx, organization: org }, "pro");
    const sub = created.at(-1)!.subscription_data as Record<string, unknown>;
    expect(sub.trial_period_days).toBeUndefined();
  });
});
