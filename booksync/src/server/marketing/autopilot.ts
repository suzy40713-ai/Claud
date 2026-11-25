import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { marketingPlan, marketingTask, product } from "@/db/schema";
import { addDays, localDateOf } from "@/domain/availability/engine";
import { PLAN_DAYS, planDay, planProgress } from "@/domain/marketing/autopilot";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";
import { getToolResult } from "./tools";

/** Lance l'Autopilot à partir d'une stratégie : 30 jours, 3 actions par jour, à partir d'aujourd'hui. */
export async function startPlan(ctx: OrgContext, strategyId: string, now = new Date()) {
  assertCan(ctx.role, "marketing.manage");
  const strategy = await getToolResult(ctx, "strategy", strategyId);
  if (!strategy?.productId) throw new UserError("Stratégie introuvable.");
  const startDate = localDateOf(now, ctx.organization.timezone);
  const rows = [...strategy.output.days]
    .filter((d) => d.day >= 1 && d.day <= PLAN_DAYS)
    .sort((a, b) => a.day - b.day)
    .flatMap((d) =>
      d.actions.slice(0, 3).map((a, position) => ({
        day: d.day,
        position,
        title: a.title.slice(0, 300),
        detail: a.detail.slice(0, 1000),
        channel: a.channel.slice(0, 60),
      })),
    );
  const unique = new Map(rows.map((r) => [`${r.day}-${r.position}`, r]));
  return db.transaction(async (tx) => {
    await tx
      .update(marketingPlan)
      .set({ active: false })
      .where(
        and(eq(marketingPlan.organizationId, ctx.organization.id), eq(marketingPlan.active, true)),
      );
    const [plan] = await tx
      .insert(marketingPlan)
      .values({
        organizationId: ctx.organization.id,
        productId: strategy.productId!,
        strategyId: strategy.id,
        startDate,
        createdByUserId: ctx.userId,
      })
      .returning();
    await tx
      .insert(marketingTask)
      .values(
        [...unique.values()].map((r) => ({
          ...r,
          organizationId: ctx.organization.id,
          planId: plan.id,
        })),
      );
    return plan;
  });
}

/** Plan actif, avec le jour courant, les actions du jour, les retards et la progression. */
export async function getActivePlan(ctx: OrgContext, now = new Date()) {
  assertCan(ctx.role, "marketing.manage");
  const [row] = await db
    .select({ plan: marketingPlan, productName: product.name })
    .from(marketingPlan)
    .innerJoin(
      product,
      and(
        eq(product.organizationId, marketingPlan.organizationId),
        eq(product.id, marketingPlan.productId),
      ),
    )
    .where(
      and(eq(marketingPlan.organizationId, ctx.organization.id), eq(marketingPlan.active, true)),
    );
  if (!row) return null;
  const tasks = await db
    .select()
    .from(marketingTask)
    .where(
      and(
        eq(marketingTask.organizationId, ctx.organization.id),
        eq(marketingTask.planId, row.plan.id),
      ),
    )
    .orderBy(asc(marketingTask.day), asc(marketingTask.position));
  const today = localDateOf(now, ctx.organization.timezone);
  const day = planDay(row.plan.startDate, today);
  return {
    plan: row.plan,
    productName: row.productName,
    day,
    dateOfDay: (d: number) => addDays(row.plan.startDate, d - 1),
    today: tasks.filter((t) => t.day === day),
    late: tasks.filter((t) => t.day < day && !t.doneAt),
    tasks,
    progress: planProgress(tasks, day),
  };
}

export async function setTaskDone(ctx: OrgContext, taskId: string, done: boolean) {
  assertCan(ctx.role, "marketing.manage");
  if (!/^[0-9a-f-]{36}$/.test(taskId)) throw new UserError("Action introuvable.");
  const [row] = await db
    .update(marketingTask)
    .set({ doneAt: done ? new Date() : null })
    .where(and(eq(marketingTask.organizationId, ctx.organization.id), eq(marketingTask.id, taskId)))
    .returning({ id: marketingTask.id });
  if (!row) throw new UserError("Action introuvable.");
}

export async function stopPlan(ctx: OrgContext) {
  assertCan(ctx.role, "marketing.manage");
  await db
    .update(marketingPlan)
    .set({ active: false })
    .where(
      and(eq(marketingPlan.organizationId, ctx.organization.id), eq(marketingPlan.active, true)),
    );
}

const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Décrivez l'action (3 caractères minimum).")
    .max(200, "200 caractères maximum."),
  detail: z.string().trim().max(500, "500 caractères maximum.").optional().default(""),
  channel: z.string().trim().max(60).optional().default("Préparation"),
});

/** Ajoute une action au jour courant du plan d'action actif (tâche libre ou issue d'un outil). */
export async function addTask(
  ctx: OrgContext,
  input: { title: string; detail?: string; channel?: string },
  now = new Date(),
) {
  assertCan(ctx.role, "marketing.manage");
  const v = taskSchema.parse(input);
  const active = await getActivePlan(ctx, now);
  if (!active) throw new UserError("Lancez d'abord votre plan d'action à partir d'une stratégie.");
  const day = Math.min(PLAN_DAYS, active.day);
  return db.transaction(async (tx) => {
    const [{ max }] = await tx
      .select({ max: sql<number>`coalesce(max(${marketingTask.position}), -1)`.mapWith(Number) })
      .from(marketingTask)
      .where(and(eq(marketingTask.planId, active.plan.id), eq(marketingTask.day, day)));
    if (max >= 19) throw new UserError("20 actions maximum par jour.");
    const [row] = await tx
      .insert(marketingTask)
      .values({
        organizationId: ctx.organization.id,
        planId: active.plan.id,
        day,
        position: max + 1,
        title: v.title,
        detail: v.detail || "Ajoutée par vous.",
        channel: v.channel || "Préparation",
      })
      .returning();
    return row;
  });
}
