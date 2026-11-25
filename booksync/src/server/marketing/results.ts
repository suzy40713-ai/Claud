import "server-only";
import { and, count, desc, eq, gt, gte, isNotNull } from "drizzle-orm";
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

/** Chiffre d'affaires et ventes déclarés depuis le 1er du mois (date locale de l'entreprise). */
export async function monthResults(ctx: OrgContext, now = new Date()) {
  assertCan(ctx.role, "marketing.manage");
  const today = localDateOf(now, ctx.organization.timezone);
  const rows = await db
    .select({ revenueCents: marketingResult.revenueCents, sales: marketingResult.sales })
    .from(marketingResult)
    .where(
      and(
        eq(marketingResult.organizationId, ctx.organization.id),
        gte(marketingResult.date, `${today.slice(0, 7)}-01`),
      ),
    );
  return {
    revenueCents: rows.reduce((s, r) => s + (r.revenueCents ?? 0), 0),
    sales: rows.reduce((s, r) => s + (r.sales ?? 0), 0),
  };
}

/** Au moins une vente déclarée depuis le début. */
export async function hasAnySale(ctx: OrgContext) {
  const [row] = await db
    .select({ n: count() })
    .from(marketingResult)
    .where(and(eq(marketingResult.organizationId, ctx.organization.id), gt(marketingResult.sales, 0)));
  return (row?.n ?? 0) > 0;
}

/** Ventes et chiffre d'affaires déclarés par semaine (8 dernières semaines), pour le graphique. */
export async function weeklyResults(ctx: OrgContext, now = new Date()) {
  const rows = await listResults(ctx, 56, now);
  const today = localDateOf(now, ctx.organization.timezone);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = addDays(today, -7 * (7 - i));
    return { start: addDays(end, -6), end, sales: 0, revenueCents: 0 };
  });
  for (const r of rows) {
    const w = weeks.find((x) => r.date >= x.start && r.date <= x.end);
    if (!w) continue;
    w.sales += r.sales ?? 0;
    w.revenueCents += r.revenueCents ?? 0;
  }
  return { weeks, hasData: rows.length > 0 };
}
