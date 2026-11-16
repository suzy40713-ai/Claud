"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import {
  disconnectStripeAccount,
  startConnectOnboarding,
  updateDepositSettings,
} from "@/server/deposit/connect";
import { runAction } from "@/server/errors";

export async function startConnectAction() {
  const ctx = await requireOrg();
  return runAction(async () => ({ url: await startConnectOnboarding(ctx) }));
}

export async function updateDepositAction(input: { mode: "none" | "fixed" | "percent"; value: number }) {
  const ctx = await requireOrg();
  const res = await runAction(
    () => updateDepositSettings(ctx, input),
    input.mode === "none" ? "Acompte désactivé." : "Acompte enregistré.",
  );
  revalidatePath("/tableau-de-bord/parametres/paiements");
  return res;
}

export async function disconnectStripeAction() {
  const ctx = await requireOrg();
  const res = await runAction(() => disconnectStripeAccount(ctx), "Compte Stripe déconnecté.");
  revalidatePath("/tableau-de-bord/parametres/paiements");
  return res;
}
