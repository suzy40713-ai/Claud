import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { appointment, customer, organization, review } from "@/db/schema";
import { assertCan } from "@/domain/permissions";
import { capitalize, formatDateLong } from "@/lib/format";
import { verifyReviewToken } from "@/lib/manage-token";
import type { OrgContext } from "@/server/auth/session";
import { NotFoundError, UserError } from "@/server/errors";

/** Un avis peut être déposé pendant 90 jours après le rendez-vous. */
export const REVIEW_WINDOW_DAYS = 90;

export const HIDE_REASONS = {
  insulting: "Propos injurieux ou diffamatoires",
  personal_data: "Données personnelles",
  off_topic: "Sans rapport avec la prestation",
  spam: "Publicité ou spam",
} as const;
export type HideReason = keyof typeof HIDE_REASONS;

export const reviewInputSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, "Choisissez une note de 1 à 5 étoiles.")
    .max(5, "Choisissez une note de 1 à 5 étoiles."),
  comment: z
    .string()
    .trim()
    .max(1000, "Votre commentaire ne doit pas dépasser 1 000 caractères.")
    .transform((v) => v || null)
    .nullable()
    .default(null),
});

/** Prénom + initiale du nom : jamais le nom complet en public. */
export function publicAuthor(firstName: string, lastName: string) {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return `${firstName.trim()}${initial ? ` ${initial}.` : ""}`;
}

async function loadForToken(token: string) {
  const id = verifyReviewToken(token);
  if (!id) return null;
  const [row] = await db
    .select({ appt: appointment, cust: customer, org: organization })
    .from(appointment)
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .innerJoin(organization, eq(organization.id, appointment.organizationId))
    .where(eq(appointment.id, id));
  return row ?? null;
}

type ReviewState = "open" | "done" | "too_early" | "closed" | "unavailable";

function stateOf(
  appt: typeof appointment.$inferSelect,
  existing: { id: string } | undefined,
  now: Date,
): ReviewState {
  if (existing) return "done";
  if (!["confirmed", "completed"].includes(appt.status)) return "unavailable";
  if (appt.endsAt > now) return "too_early";
  if (now.getTime() - appt.endsAt.getTime() > REVIEW_WINDOW_DAYS * 86_400_000) return "closed";
  return "open";
}

/** Page publique « donner mon avis » (lien signé reçu par email). */
export async function getReviewView(token: string, now = new Date()) {
  const row = await loadForToken(token);
  if (!row) return null;
  const { appt, cust, org } = row;
  const [existing] = await db
    .select({ id: review.id, rating: review.rating })
    .from(review)
    .where(eq(review.appointmentId, appt.id));
  return {
    state: stateOf(appt, existing, now),
    rating: existing?.rating ?? null,
    organizationName: org.name,
    slug: org.slug,
    serviceName: appt.serviceName,
    dateLabel: capitalize(formatDateLong(appt.startsAt, org.timezone)),
    customerFirstName: cust.firstName,
  };
}

/** Dépôt d'un avis : un seul par rendez-vous, publié immédiatement (avis vérifié). */
export async function submitReview(
  token: string,
  input: z.input<typeof reviewInputSchema>,
  now = new Date(),
) {
  const data = reviewInputSchema.parse(input);
  const row = await loadForToken(token);
  if (!row) throw new NotFoundError("Lien invalide.");
  const { appt } = row;
  const [existing] = await db
    .select({ id: review.id })
    .from(review)
    .where(eq(review.appointmentId, appt.id));
  const state = stateOf(appt, existing, now);
  if (state === "done") throw new UserError("Vous avez déjà donné votre avis pour ce rendez-vous.");
  if (state === "too_early")
    throw new UserError("Vous pourrez donner votre avis après votre rendez-vous.");
  if (state === "closed")
    throw new UserError("Le délai pour donner un avis sur ce rendez-vous est dépassé.");
  if (state !== "open") throw new UserError("Ce rendez-vous ne peut pas recevoir d'avis.");
  const [created] = await db
    .insert(review)
    .values({
      organizationId: appt.organizationId,
      appointmentId: appt.id,
      customerId: appt.customerId,
      rating: data.rating,
      comment: data.comment,
      status: "published",
    })
    .onConflictDoNothing({ target: review.appointmentId })
    .returning();
  if (!created) throw new UserError("Vous avez déjà donné votre avis pour ce rendez-vous.");
  return created;
}

export type RatingSummary = { average: number; count: number };

/** Note moyenne et nombre d'avis publiés, pour plusieurs établissements à la fois. */
export async function getRatingSummaries(orgIds: string[]): Promise<Map<string, RatingSummary>> {
  const out = new Map<string, RatingSummary>();
  if (!orgIds.length) return out;
  const rows = await db
    .select({
      organizationId: review.organizationId,
      average: sql<number>`round(avg(${review.rating})::numeric, 1)::float8`,
      count: sql<number>`count(*)::int`,
    })
    .from(review)
    .where(and(inArray(review.organizationId, orgIds), eq(review.status, "published")))
    .groupBy(review.organizationId);
  for (const r of rows) out.set(r.organizationId, { average: r.average, count: r.count });
  return out;
}

/** Derniers avis publiés d'un établissement (page publique). */
export async function listPublicReviews(organizationId: string, limit = 6) {
  const rows = await db
    .select({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reply: review.reply,
      createdAt: review.createdAt,
      serviceName: appointment.serviceName,
      firstName: customer.firstName,
      lastName: customer.lastName,
    })
    .from(review)
    .innerJoin(appointment, eq(appointment.id, review.appointmentId))
    .innerJoin(customer, eq(customer.id, review.customerId))
    .where(and(eq(review.organizationId, organizationId), eq(review.status, "published")))
    .orderBy(desc(review.createdAt))
    .limit(limit);
  return rows.map(({ firstName, lastName, ...r }) => ({
    ...r,
    author: publicAuthor(firstName, lastName),
  }));
}

/* ───────────── Espace professionnel ───────────── */

export async function listOrgReviews(ctx: OrgContext) {
  assertCan(ctx.role, "reviews.manage");
  return db
    .select({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reply: review.reply,
      status: review.status,
      hiddenReason: review.hiddenReason,
      createdAt: review.createdAt,
      serviceName: appointment.serviceName,
      appointmentStartsAt: appointment.startsAt,
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
    })
    .from(review)
    .innerJoin(appointment, eq(appointment.id, review.appointmentId))
    .innerJoin(customer, eq(customer.id, review.customerId))
    .where(eq(review.organizationId, ctx.organization.id))
    .orderBy(desc(review.createdAt))
    .limit(200);
}

async function ownedReview(ctx: OrgContext, id: string) {
  assertCan(ctx.role, "reviews.manage");
  const [row] = await db
    .select()
    .from(review)
    .where(and(eq(review.id, id), eq(review.organizationId, ctx.organization.id)));
  if (!row) throw new NotFoundError("Avis introuvable.");
  return row;
}

export const replySchema = z.object({
  reviewId: z.uuid(),
  reply: z.string().trim().max(1000, "La réponse ne doit pas dépasser 1 000 caractères."),
});

/** Réponse publique du professionnel (texte vide = réponse supprimée). */
export async function replyToReview(ctx: OrgContext, input: z.input<typeof replySchema>) {
  const data = replySchema.parse(input);
  await ownedReview(ctx, data.reviewId);
  await db
    .update(review)
    .set({ reply: data.reply || null, repliedAt: data.reply ? new Date() : null })
    .where(eq(review.id, data.reviewId));
}

export const visibilitySchema = z.discriminatedUnion("visible", [
  z.object({ reviewId: z.uuid(), visible: z.literal(true) }),
  z.object({
    reviewId: z.uuid(),
    visible: z.literal(false),
    reason: z.enum(Object.keys(HIDE_REASONS) as [HideReason, ...HideReason[]], {
      message: "Choisissez un motif.",
    }),
  }),
]);

/**
 * Masquage d'un avis : uniquement pour un motif légitime (pas parce qu'il est négatif),
 * le motif est conservé. Un avis masqué peut être republié.
 */
export async function setReviewVisibility(
  ctx: OrgContext,
  input: z.input<typeof visibilitySchema>,
) {
  const data = visibilitySchema.parse(input);
  await ownedReview(ctx, data.reviewId);
  await db
    .update(review)
    .set(
      data.visible
        ? { status: "published", hiddenReason: null }
        : { status: "hidden", hiddenReason: HIDE_REASONS[data.reason] },
    )
    .where(eq(review.id, data.reviewId));
}
