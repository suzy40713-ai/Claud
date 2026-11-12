import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { automationRule, autopilotAction } from "@/db/schema";
import {
  getAutomation,
  isAutomationActive,
  isAutomationKey,
  planIncludes,
  resolveAutomations,
  type AutomationKey,
  type StoredRules,
} from "@/domain/autopilot/automations";
import type { PlanId } from "@/domain/billing/plans";
import { assertCan, ForbiddenError } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";

type Executor = Pick<typeof db, "select">;

/** Choix enregistrés par l'entreprise (une seule requête, utilisable dans une transaction). */
export async function loadStoredRules(executor: Executor, organizationId: string) {
  const rows = await executor
    .select({ key: automationRule.key, enabled: automationRule.enabled })
    .from(automationRule)
    .where(eq(automationRule.organizationId, organizationId));
  const stored: StoredRules = {};
  for (const r of rows) if (isAutomationKey(r.key)) stored[r.key] = r.enabled;
  return stored;
}

/** Fonction de test d'activation pour une entreprise et un forfait donnés. */
export async function loadActiveChecker(executor: Executor, organizationId: string, plan: PlanId) {
  const stored = await loadStoredRules(executor, organizationId);
  return (key: AutomationKey) => isAutomationActive(key, plan, stored);
}

export async function listAutomations(ctx: OrgContext) {
  assertCan(ctx.role, "autopilot.view");
  return resolveAutomations(ctx.plan.id, await loadStoredRules(db, ctx.organization.id));
}

/** Active ou désactive une automatisation, et l'inscrit dans l'historique Autopilot. */
export async function setAutomation(ctx: OrgContext, key: string, enabled: boolean) {
  assertCan(ctx.role, "autopilot.manage");
  if (!isAutomationKey(key)) throw new UserError("Automatisation inconnue.");
  const def = getAutomation(key);
  if (def.locked) throw new UserError("Cette protection est toujours active.");
  if (enabled && !planIncludes(ctx.plan.id, def.minPlan)) {
    throw new ForbiddenError(
      `« ${def.title} » est inclus à partir du forfait ${def.minPlan === "pro" ? "Pro" : "Starter"}.`,
    );
  }
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ enabled: automationRule.enabled })
      .from(automationRule)
      .where(
        and(eq(automationRule.organizationId, ctx.organization.id), eq(automationRule.key, key)),
      )
      .limit(1);
    const before = current?.enabled ?? def.defaultEnabled;
    await tx
      .insert(automationRule)
      .values({ organizationId: ctx.organization.id, key, enabled, updatedByUserId: ctx.userId })
      .onConflictDoUpdate({
        target: [automationRule.organizationId, automationRule.key],
        set: { enabled, updatedByUserId: ctx.userId },
      });
    if (before !== enabled) {
      await tx.insert(autopilotAction).values({
        organizationId: ctx.organization.id,
        source: "user",
        kind: "automation.updated",
        status: "done",
        summary: `${def.title} ${enabled ? "activée" : "désactivée"} par ${ctx.user.name}`,
        payload: { key, enabled },
        actorUserId: ctx.userId,
        decidedAt: new Date(),
      });
    }
  });
}
