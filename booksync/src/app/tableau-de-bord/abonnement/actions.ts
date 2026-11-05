"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import {
  createPortalSession,
  setCancelAtPeriodEnd,
  startSubscription,
} from "@/server/billing/service";
import { runAction } from "@/server/errors";

export async function subscribeAction(plan: "starter" | "pro") {
  const ctx = await requireOrg();
  const res = await runAction(() => startSubscription(ctx, plan));
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function cancelSubscriptionAction(cancel: boolean) {
  const ctx = await requireOrg();
  const res = await runAction(
    () => setCancelAtPeriodEnd(ctx, cancel),
    cancel
      ? "Résiliation programmée à la fin de la période en cours."
      : "Votre abonnement continue.",
  );
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function portalAction() {
  const ctx = await requireOrg();
  return runAction(() => createPortalSession(ctx));
}
