"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { service } from "@/db/schema";
import { ACTIVITIES } from "@/domain/activities";
import { assertCan } from "@/domain/permissions";
import { requireOrg } from "@/server/auth/session";
import { createService } from "@/server/catalog/services";
import { setWeeklyHours } from "@/server/catalog/staff";
import { runAction } from "@/server/errors";
import { markOnboardingStep } from "@/server/onboarding";

/** Horaires d'ouverture + mêmes horaires pour le propriétaire (cas de l'indépendant). */
export async function saveSetupHoursAction(week: unknown, applyToMe: boolean) {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    await setWeeklyHours(ctx, null, week);
    if (applyToMe && ctx.staffId) await setWeeklyHours(ctx, ctx.staffId, week);
    await markOnboardingStep(ctx.organization.id, "hours");
  }, "Horaires enregistrés.");
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

/** Ajoute les prestations d'exemple de l'activité (uniquement si aucun service n'existe). */
export async function addSuggestedServicesAction() {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    assertCan(ctx.role, "services.manage");
    const [{ n }] = await db
      .select({ n: count() })
      .from(service)
      .where(and(eq(service.organizationId, ctx.organization.id), isNull(service.deletedAt)));
    if (n > 0) return;
    const activity =
      ACTIVITIES.find((a) => a.value === ctx.organization.activity) ??
      ACTIVITIES[ACTIVITIES.length - 1];
    for (const [name, durationMinutes, priceCents] of activity.examples) {
      await createService(ctx, {
        name,
        durationMinutes,
        priceCents,
        staffIds: ctx.staffId ? [ctx.staffId] : [],
      });
    }
  }, "Prestations ajoutées. Ajustez-les à votre convenance.");
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function finishSetupAction() {
  const ctx = await requireOrg();
  assertCan(ctx.role, "organization.update");
  await markOnboardingStep(ctx.organization.id, "done");
  revalidatePath("/tableau-de-bord", "layout");
  redirect("/tableau-de-bord");
}
