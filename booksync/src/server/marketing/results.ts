import "server-only";
import { and, count, desc, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { aiGeneration, marketingResult, marketingTask } from "@/db/schema";
import { addDays, localDateOf } from "@/domain/availability/engine";
import { resultSchema, type ResultInput } from "@/domain/marketing/results";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";
import { getProduct } from "./products";

export async function addResult(ctx: OrgContext, input: ResultInput, now = new Date()) {
  assertCan(ctx.role, "marketing.manage");
  const v = resultSchema.parse(input);
  const today = localDateOf(now, ctx.organization.timezone);
  if (v.date > today || v.date < addDays(today, -730))
    throw new UserError("Date invalide.", { date: "Choisissez une date des deux dernières années." });
  if (v.productId && !(await getProduct(ctx, v.productId)))
    throw new UserError("Produit introuvable.", { productId: "Produit introuvable." });
  const [row] = await db
    .insert(marketingResult)
    .values({
      organizationId: ctx.organization.id,
      productId: v.productId,
      date: v.date,
      channel: v.channel,
      spendCents: v.spend ?? 0,
      impressions: v.impressions,
      clicks: v.clicks,
      sales: v.sales,
      revenueCents: v.revenue,
      note: v.note,
      createdByUserId: ctx.userId,
    })
    .returning();
  return row;
}

export async function deleteResult(ctx: OrgContext, id: string) {
  assertCan(ctx.role, "marketing.manage");
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new UserError("Ligne introuvable.");
  const [row] = await db
    .delete(marketingResult)
    .where(and(eq(marketingResult.organizationId, ctx.organization.id), eq(marketingResult.id, id)))
    .returning({ id: marketingResult.id });
  if (!row) throw new UserError("Ligne introuvable.");
}

/** Résultats déclarés sur une période (en jours, date locale), du plus récent au plus ancien. */
export async function listResults(ctx: OrgContext, days: number, now = new Date()) {
  assertCan(ctx.role, "marketing.manage");
  const since = addDays(localDateOf(now, ctx.organization.timezone), -(days - 1));
  return db
    .select()
    .from(marketingResult)
    .where(and(eq(marketingResult.organizationId, ctx.organization.id), gte(marketingResult.date, since)))
    .orderBy(desc(marketingResult.date), desc(marketingResult.createdAt));
}

/** Usage réel de BookSync (compté, pas estimé). */
export async function copilotActivity(ctx: OrgContext) {
  assertCan(ctx.role, "marketing.manage");
  const [gen] = await db
    .select({ n: count() })
    .from(aiGeneration)
    .where(eq(aiGeneration.organizationId, ctx.organization.id));
  const [tasks] = await db
    .select({ n: count() })
    .from(marketingTask)
    .where(and(eq(marketingTask.organizationId, ctx.organization.id), isNotNull(marketingTask.doneAt)));
  return { generations: gen?.n ?? 0, tasksDone: tasks?.n ?? 0 };
}
