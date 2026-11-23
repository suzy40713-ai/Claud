"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import { setTaskDone, startPlan, stopPlan } from "@/server/marketing/autopilot";

export async function startPlanAction(strategyId: string) {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    await startPlan(ctx, strategyId);
  }, "Autopilot lancé : jour 1 aujourd'hui.");
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function setTaskDoneAction(taskId: string, done: boolean) {
  const ctx = await requireOrg();
  const res = await runAction(() => setTaskDone(ctx, taskId, done));
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function stopPlanAction() {
  const ctx = await requireOrg();
  const res = await runAction(() => stopPlan(ctx), "Autopilot arrêté.");
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}
