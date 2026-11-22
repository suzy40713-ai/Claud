"use server";

import { revalidatePath } from "next/cache";
import { parseEuroInput } from "@/domain/billing/gift-card";
import { requireOrg } from "@/server/auth/session";
import { runAction, UserError } from "@/server/errors";
import { findGiftCardByCode, updateGiftCardSettings, spendGiftCard } from "@/server/gift-cards";

const PATH = "/tableau-de-bord/cartes-cadeaux";

export async function updateGiftSettingsAction(input: { enabled: boolean; amounts: string }) {
  const ctx = await requireOrg();
  const res = await runAction(
    () => updateGiftCardSettings(ctx, input),
    input.enabled ? "Cartes cadeaux activées." : "Cartes cadeaux désactivées.",
  );
  revalidatePath(PATH);
  return res;
}

export async function lookupGiftCardAction(code: string) {
  const ctx = await requireOrg();
  return runAction(async () => {
    const { card, uses } = await findGiftCardByCode(ctx, code);
    return {
      code: card.code,
      status: card.status,
      amountCents: card.amountCents,
      balanceCents: card.balanceCents,
      recipientName: card.recipientName,
      expiresAt: card.expiresAt?.toISOString() ?? null,
      uses: uses.map((u) => ({
        amountCents: u.amountCents,
        at: u.createdAt.toISOString(),
        by: u.by,
      })),
    };
  });
}

export async function spendGiftCardAction(code: string, amount: string) {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    const cents = parseEuroInput(amount);
    if (cents === null) throw new UserError("Montant invalide, par exemple 25 ou 25,50.");
    const card = await spendGiftCard(ctx, code, cents);
    return { balanceCents: card.balanceCents };
  });
  revalidatePath(PATH);
  return res;
}
