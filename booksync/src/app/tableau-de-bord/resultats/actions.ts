"use server";

import { revalidatePath } from "next/cache";
import type { ResultInput } from "@/domain/marketing/results";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import { addResult, deleteResult } from "@/server/marketing/results";

export async function addResultAction(input: ResultInput) {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    await addResult(ctx, input);
  }, "Résultat enregistré.");
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function deleteResultAction(id: string) {
  const ctx = await requireOrg();
  const res = await runAction(() => deleteResult(ctx, id), "Ligne supprimée.");
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}
