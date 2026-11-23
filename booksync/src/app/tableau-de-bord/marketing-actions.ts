"use server";

import { revalidatePath } from "next/cache";
import { isToolKind } from "@/domain/marketing/tools";
import { requireOrg } from "@/server/auth/session";
import { runAction, UserError } from "@/server/errors";
import { runTool } from "@/server/marketing/tools";

export async function runToolAction(kind: string, productId: string, options: unknown) {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    if (!isToolKind(kind)) throw new UserError("Outil inconnu.");
    const r = await runTool(ctx, kind, productId, options);
    return { id: r.id, cached: r.cached };
  }, "C'est prêt.");
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}
