import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { emailMessage, giftCard, giftCardUse, organization } from "@/db/schema";
import { handleDepositEvent } from "@/server/deposit/payment";
import {
  confirmGiftCardPayment,
  createGiftCardCheckout,
  findGiftCardByCode,
  giftCardsOffered,
  updateGiftCardSettings,
  spendGiftCard,
} from "@/server/gift-cards";
import { makeOrg, uid } from "./factory";

afterAll(() => pg.end());
afterEach(() => vi.restoreAllMocks());

/** Faux client Stripe : enregistre les appels, aucun accès réseau. */
function fakeStripe() {
  const create = vi.fn(async (params: Record<string, unknown>, opts: Record<string, unknown>) => ({
    id: `cs_test_${uid()}`,
    url: "https://checkout.stripe.com/c/pay/test",
    params,
    opts,
  }));
  const stripe = { checkout: { sessions: { create } } } as unknown as Stripe;
  return { stripe, create };
}

async function giftOrg(opts: { plan?: "free" | "starter" | "pro"; ready?: boolean } = {}) {
  const ctx = await makeOrg({ plan: opts.plan ?? "starter" });
  const acct = `acct_test_${uid()}`;
  await db
    .update(organization)
    .set({ stripeAccountId: acct, stripeAccountReady: opts.ready ?? true })
    .where(eq(organization.id, ctx.organization.id));
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ctx.organization.id));
  return { ctx: { ...ctx, organization: org }, acct };
}

const purchase = {
  amountCents: 5_000,
  buyerName: "Julie Martin",
  buyerEmail: "Julie@Example.com",
  recipientName: "Maman",
  message: "Joyeux Noël !",
};

async function reload(id: string) {
  const [org] = await db.select().from(organization).where(eq(organization.id, id));
  return org;
}

describe("cartes cadeaux — réglages", () => {
  it("s'activent seulement avec un compte Stripe prêt et un forfait Starter ou Pro", async () => {
    const free = await giftOrg({ plan: "free" });
    await expect(
      updateGiftCardSettings(free.ctx, { enabled: true, amounts: "30 50" }),
    ).rejects.toThrow(/Starter/);
    const notReady = await giftOrg({ ready: false });
    await expect(
      updateGiftCardSettings(notReady.ctx, { enabled: true, amounts: "30 50" }),
    ).rejects.toThrow(/Stripe/);

    const { ctx } = await giftOrg();
    await updateGiftCardSettings(ctx, { enabled: true, amounts: "100, 25 50" });
    const org = await reload(ctx.organization.id);
    expect(org.giftCardsEnabled).toBe(true);
    expect(org.giftCardAmounts).toEqual([2_500, 5_000, 10_000]);
    expect(giftCardsOffered(org)).toBe(true);
  });

  it("refuse des montants invalides", async () => {
    const { ctx } = await giftOrg();
    await expect(updateGiftCardSettings(ctx, { enabled: true, amounts: "2" })).rejects.toThrow(
      /10 €/,
    );
  });
});

describe("cartes cadeaux — achat et paiement", () => {
  it("crée la carte en attente et la page de paiement sur le compte Stripe du salon", async () => {
    const { ctx, acct } = await giftOrg();
    await updateGiftCardSettings(ctx, { enabled: true, amounts: "30 50 100" });
    const org = await reload(ctx.organization.id);
    const { stripe, create } = fakeStripe();

    const url = await createGiftCardCheckout(stripe, org, purchase);
    expect(url).toContain("checkout.stripe.com");
    const [params, opts] = create.mock.calls[0];
    expect(opts).toMatchObject({ stripeAccount: acct });
    expect(params).toMatchObject({
      mode: "payment",
      customer_email: "julie@example.com",
      metadata: { kind: "booksync_gift_card", organizationId: org.id },
    });
    expect(JSON.stringify(params)).toContain('"unit_amount":5000');
    expect(params).not.toHaveProperty("payment_intent_data.application_fee_amount");

    const [card] = await db.select().from(giftCard).where(eq(giftCard.organizationId, org.id));
    expect(card).toMatchObject({ status: "pending", amountCents: 5_000, balanceCents: 5_000 });
    expect(card.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("refuse un montant non proposé ou un salon qui ne vend pas de cartes", async () => {
    const { ctx } = await giftOrg();
    const { stripe } = fakeStripe();
    await expect(createGiftCardCheckout(stripe, ctx.organization, purchase)).rejects.toThrow(
      /ne vend pas/,
    );
    await updateGiftCardSettings(ctx, { enabled: true, amounts: "30" });
    await expect(
      createGiftCardCheckout(stripe, await reload(ctx.organization.id), purchase),
    ).rejects.toThrow(/montants proposés/);
  });

  it("paiement confirmé par le webhook : carte active 12 mois et email à l'acheteur, une seule fois", async () => {
    const { ctx, acct } = await giftOrg();
    await updateGiftCardSettings(ctx, { enabled: true, amounts: "50" });
    const org = await reload(ctx.organization.id);
    await createGiftCardCheckout(fakeStripe().stripe, org, purchase);
    const [card] = await db.select().from(giftCard).where(eq(giftCard.organizationId, org.id));

    const event = {
      id: `evt_${uid()}`,
      type: "checkout.session.completed",
      account: acct,
      data: {
        object: {
          id: card.stripeCheckoutSessionId,
          payment_status: "paid",
          payment_intent: "pi_test_gift",
          metadata: { kind: "booksync_gift_card", giftCardId: card.id },
        },
      },
    } as unknown as Stripe.Event;
    await handleDepositEvent(event, fakeStripe().stripe);
    await handleDepositEvent(event, fakeStripe().stripe);

    const [paid] = await db.select().from(giftCard).where(eq(giftCard.id, card.id));
    expect(paid.status).toBe("active");
    expect(paid.stripePaymentIntentId).toBe("pi_test_gift");
    const months =
      (paid.expiresAt!.getFullYear() - paid.paidAt!.getFullYear()) * 12 +
      paid.expiresAt!.getMonth() -
      paid.paidAt!.getMonth();
    expect(months).toBe(12);
    const mails = await db
      .select()
      .from(emailMessage)
      .where(eq(emailMessage.to, "julie@example.com"));
    const giftMails = mails.filter((m) => m.template === "gift_card" && m.text.includes(card.code));
    expect(giftMails).toHaveLength(1);
    expect(giftMails[0].text).toMatch(/\/carte-cadeau\/[0-9a-f-]{36}\./);
  });

  it("ignore un paiement venant d'un autre compte Stripe", async () => {
    const { ctx } = await giftOrg();
    await updateGiftCardSettings(ctx, { enabled: true, amounts: "50" });
    const org = await reload(ctx.organization.id);
    await createGiftCardCheckout(fakeStripe().stripe, org, purchase);
    const [card] = await db.select().from(giftCard).where(eq(giftCard.organizationId, org.id));
    const r = await confirmGiftCardPayment(
      {
        id: "cs_x",
        payment_status: "paid",
        payment_intent: "pi_x",
        metadata: { giftCardId: card.id },
      },
      "acct_pirate",
    );
    expect(r).toBe("ignored");
    const [still] = await db.select().from(giftCard).where(eq(giftCard.id, card.id));
    expect(still.status).toBe("pending");
  });

  it("page de paiement expirée : la carte non payée est supprimée", async () => {
    const { ctx, acct } = await giftOrg();
    await updateGiftCardSettings(ctx, { enabled: true, amounts: "50" });
    const org = await reload(ctx.organization.id);
    await createGiftCardCheckout(fakeStripe().stripe, org, purchase);
    const [card] = await db.select().from(giftCard).where(eq(giftCard.organizationId, org.id));
    await handleDepositEvent(
      {
        id: `evt_${uid()}`,
        type: "checkout.session.expired",
        account: acct,
        data: {
          object: { id: "cs", metadata: { kind: "booksync_gift_card", giftCardId: card.id } },
        },
      } as unknown as Stripe.Event,
      fakeStripe().stripe,
    );
    expect(await db.select().from(giftCard).where(eq(giftCard.id, card.id))).toHaveLength(0);
  });
});

describe("cartes cadeaux — utilisation au salon", () => {
  async function paidCard() {
    const { ctx, acct } = await giftOrg();
    await updateGiftCardSettings(ctx, { enabled: true, amounts: "50" });
    const org = await reload(ctx.organization.id);
    await createGiftCardCheckout(fakeStripe().stripe, org, purchase);
    const [card] = await db.select().from(giftCard).where(eq(giftCard.organizationId, org.id));
    await confirmGiftCardPayment(
      {
        id: card.stripeCheckoutSessionId!,
        payment_status: "paid",
        payment_intent: "pi",
        metadata: { giftCardId: card.id },
      },
      acct,
    );
    return { ctx, card };
  }

  it("déduit les utilisations du solde et les journalise", async () => {
    const { ctx, card } = await paidCard();
    const typed = card.code.toLowerCase().replace("-", " ");
    const after = await spendGiftCard(ctx, typed, 3_500);
    expect(after.balanceCents).toBe(1_500);
    await expect(spendGiftCard(ctx, card.code, 2_000)).rejects.toThrow(/solde/);
    await spendGiftCard(ctx, card.code, 1_500);
    await expect(spendGiftCard(ctx, card.code, 100)).rejects.toThrow(/entièrement utilisée/);

    const { card: found, uses } = await findGiftCardByCode(ctx, card.code);
    expect(found.balanceCents).toBe(0);
    expect(uses.map((u) => u.amountCents).sort()).toEqual([1_500, 3_500]);
    expect(uses[0].by).toBeTruthy();
  });

  it("deux utilisations simultanées ne dépassent jamais le solde", async () => {
    const { ctx, card } = await paidCard();
    const results = await Promise.allSettled([
      spendGiftCard(ctx, card.code, 4_000),
      spendGiftCard(ctx, card.code, 4_000),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [final] = await db.select().from(giftCard).where(eq(giftCard.id, card.id));
    expect(final.balanceCents).toBe(1_000);
    expect(
      await db.select().from(giftCardUse).where(eq(giftCardUse.giftCardId, card.id)),
    ).toHaveLength(1);
  });

  it("une carte d'un autre salon est introuvable", async () => {
    const { card } = await paidCard();
    const other = await giftOrg();
    await expect(spendGiftCard(other.ctx, card.code, 100)).rejects.toThrow(/Aucune carte/);
  });

  it("une carte non payée ne peut pas être utilisée", async () => {
    const { ctx } = await giftOrg();
    await updateGiftCardSettings(ctx, { enabled: true, amounts: "50" });
    await createGiftCardCheckout(fakeStripe().stripe, await reload(ctx.organization.id), purchase);
    const [card] = await db
      .select()
      .from(giftCard)
      .where(eq(giftCard.organizationId, ctx.organization.id));
    await expect(spendGiftCard(ctx, card.code, 100)).rejects.toThrow(/pas encore été payée/);
  });
});
