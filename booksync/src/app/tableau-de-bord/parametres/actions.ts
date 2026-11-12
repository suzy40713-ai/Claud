"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import {
  replaceOrganizationImage,
  updateBookingSettings,
  updateBranding,
  updateOrganizationInfo,
} from "@/server/organizations/settings";

function done<T>(res: T): T {
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function updateOrganizationInfoAction(
  input: Parameters<typeof updateOrganizationInfo>[1],
) {
  const ctx = await requireOrg();
  return done(
    await runAction(() => updateOrganizationInfo(ctx, input), "Informations enregistrées."),
  );
}

export async function updateBookingSettingsAction(
  input: Parameters<typeof updateBookingSettings>[1],
) {
  const ctx = await requireOrg();
  return done(
    await runAction(
      () => updateBookingSettings(ctx, input),
      "Réglages de réservation enregistrés.",
    ),
  );
}

export async function updateBrandingAction(input: Parameters<typeof updateBranding>[1]) {
  const ctx = await requireOrg();
  return done(await runAction(() => updateBranding(ctx, input), "Personnalisation enregistrée."));
}

export async function uploadOrganizationImageAction(formData: FormData) {
  const ctx = await requireOrg();
  const kind = formData.get("kind") === "cover" ? "cover" : "logo";
  const upload = formData.get("file");
  return done(
    await runAction(
      () => replaceOrganizationImage(ctx, kind, upload instanceof File ? upload : null),
      upload instanceof File ? "Image enregistrée." : "Image supprimée.",
    ),
  );
}
