"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import {
  addTimeOff,
  removeTimeOff,
  setStaffPhoto,
  setStaffServices,
  setWeeklyHours,
  updateStaffProfile,
} from "@/server/catalog/staff";

function refresh<T>(res: T): T {
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function saveHoursAction(staffId: string | null, week: unknown) {
  const ctx = await requireOrg();
  return refresh(await runAction(() => setWeeklyHours(ctx, staffId, week), "Horaires enregistrés."));
}

export async function addTimeOffAction(staffId: string | null, input: Parameters<typeof addTimeOff>[2]) {
  const ctx = await requireOrg();
  return refresh(
    await runAction(async () => {
      await addTimeOff(ctx, staffId, input);
    }, staffId ? "Absence enregistrée." : "Fermeture enregistrée."),
  );
}

export async function removeTimeOffAction(id: string) {
  const ctx = await requireOrg();
  return refresh(await runAction(() => removeTimeOff(ctx, id), "Supprimé."));
}

export async function updateStaffProfileAction(staffId: string, input: Parameters<typeof updateStaffProfile>[2]) {
  const ctx = await requireOrg();
  return refresh(await runAction(() => updateStaffProfile(ctx, staffId, input), "Profil enregistré."));
}

export async function setStaffServicesAction(staffId: string, serviceIds: string[]) {
  const ctx = await requireOrg();
  return refresh(await runAction(() => setStaffServices(ctx, staffId, serviceIds), "Services autorisés enregistrés."));
}

export async function setStaffPhotoAction(staffId: string, formData: FormData) {
  const ctx = await requireOrg();
  const file = formData.get("file");
  return refresh(
    await runAction(
      () => setStaffPhoto(ctx, staffId, file instanceof File ? file : null),
      file instanceof File ? "Photo enregistrée." : "Photo supprimée.",
    ),
  );
}
