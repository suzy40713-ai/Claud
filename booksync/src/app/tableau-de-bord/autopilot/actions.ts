"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { setAutomation } from "@/server/autopilot/rules";
import { runAction } from "@/server/errors";

export async function setAutomationAction(key: string, enabled: boolean) {
  const ctx = await requireOrg();
  const res = await runAction(
    () => setAutomation(ctx, key, enabled),
    enabled ? "Automatisation activée." : "Automatisation désactivée.",
  );
  revalidatePath("/tableau-de-bord/autopilot");
  return res;
}
