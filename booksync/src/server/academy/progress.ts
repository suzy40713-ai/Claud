import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { lessonProgress } from "@/db/schema";
import { ALL_LESSONS, findLesson } from "@/domain/academy/lessons";
import { planAtLeast } from "@/domain/billing/plans";
import type { OrgContext } from "@/server/auth/session";
import { ForbiddenError } from "@/domain/permissions";
import { UserError } from "@/server/errors";

export function canReadLesson(ctx: OrgContext, lessonId: string) {
  const l = findLesson(lessonId);
  return Boolean(l && planAtLeast(ctx.plan.id, l.minPlan));
}

/** Leçons terminées par l'utilisateur courant. */
export async function completedLessons(ctx: OrgContext) {
  const rows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.organizationId, ctx.organization.id),
        eq(lessonProgress.userId, ctx.userId),
      ),
    );
  return new Set(rows.map((r) => r.lessonId));
}

export async function academyProgress(ctx: OrgContext) {
  const done = await completedLessons(ctx);
  const count = ALL_LESSONS.filter((l) => done.has(l.id)).length;
  return { done, count, total: ALL_LESSONS.length };
}

export async function setLessonDone(ctx: OrgContext, lessonId: string, done: boolean) {
  if (!findLesson(lessonId)) throw new UserError("Leçon introuvable.");
  if (!canReadLesson(ctx, lessonId))
    throw new ForbiddenError("Cette leçon est incluse dans un forfait supérieur.");
  if (done)
    await db
      .insert(lessonProgress)
      .values({ organizationId: ctx.organization.id, userId: ctx.userId, lessonId })
      .onConflictDoNothing();
  else
    await db
      .delete(lessonProgress)
      .where(
        and(
          eq(lessonProgress.organizationId, ctx.organization.id),
          eq(lessonProgress.userId, ctx.userId),
          eq(lessonProgress.lessonId, lessonId),
        ),
      );
}
