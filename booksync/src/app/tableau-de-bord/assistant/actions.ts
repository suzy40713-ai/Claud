"use server";

import { requireOrg } from "@/server/auth/session";
import { askAssistant } from "@/server/assistant/service";
import { runAction, UserError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";

export async function askAssistantAction(question: string) {
  const ctx = await requireOrg();
  return runAction(async () => {
    if (!rateLimit(`assistant:${ctx.userId}`, 6, 60_000))
      throw new UserError("Trop de questions d'affilée. Patientez une minute.");
    return askAssistant(ctx, question);
  });
}
