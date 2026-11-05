"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import { createService, deleteService, setServiceImage, updateService } from "@/server/catalog/services";

function refresh<T>(res: T): T {
  revalidatePath("/tableau-de-bord/services");
  return res;
}

export async function saveServiceAction(id: string | null, input: Parameters<typeof createService>[1]) {
  const ctx = await requireOrg();
  return refresh(
    await runAction(
      async () => {
        if (id) await updateService(ctx, id, input);
        else await createService(ctx, input);
      },
      id ? "Service modifié." : "Service créé.",
    ),
  );
}

export async function deleteServiceAction(id: string) {
  const ctx = await requireOrg();
  return refresh(await runAction(() => deleteService(ctx, id), "Service supprimé."));
}

export async function setServiceImageAction(id: string, formData: FormData) {
  const ctx = await requireOrg();
  const file = formData.get("file");
  return refresh(await runAction(() => setServiceImage(ctx, id, file instanceof File ? file : null), "Image enregistrée."));
}
