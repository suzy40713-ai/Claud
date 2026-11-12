"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import {
  addWaitlistEntry,
  cancelWaitlistEntry,
  type WaitlistInput,
} from "@/server/waitlist/service";

export async function addWaitlistEntryAction(input: WaitlistInput) {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    await addWaitlistEntry(ctx, input);
  }, "Client inscrit sur la liste d'attente.");
  revalidatePath("/tableau-de-bord/liste-attente");
  return res;
}

export async function cancelWaitlistEntryAction(id: string) {
  const ctx = await requireOrg();
  const res = await runAction(() => cancelWaitlistEntry(ctx, id), "Inscription retirée.");
  revalidatePath("/tableau-de-bord/liste-attente");
  return res;
}
