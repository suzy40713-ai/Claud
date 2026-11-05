"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { markNotificationsRead } from "@/server/notifications/queue";

export async function markAllReadAction() {
  const ctx = await requireOrg();
  await markNotificationsRead(ctx.organization.id, ctx.user.email);
  revalidatePath("/tableau-de-bord", "layout");
  return { ok: true as const };
}
