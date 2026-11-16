import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { appointment, emailMessage, notification, organization, review } from "@/db/schema";
import { ForbiddenError } from "@/domain/permissions";
import { createReviewToken } from "@/lib/manage-token";
import { cancelAppointment, createAppointment } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import {
  getRatingSummaries,
  getReviewView,
  listOrgReviews,
  listPublicReviews,
  replyToReview,
  setReviewVisibility,
  submitReview,
} from "@/server/reviews";
import { makeOrg, makeUser, ctxFor, uid } from "./factory";

afterAll(() => pg.end());
afterEach(() => vi.restoreAllMocks());

const HOUR = 3_600_000;

/** Rendez-vous déjà passé (saisi manuellement), client avec email. */
async function pastBooking(opts: { plan?: "free" | "starter" | "pro"; hoursAgo?: number } = {}) {
  const ctx = await makeOrg({ plan: opts.plan ?? "starter" });
  const svc = await createService(ctx, {
    name: "Coupe homme",
    durationMinutes: 30,
    priceCents: 2000,
    staffIds: [ctx.staffId!],
  });
  const [org] = await db.select().from(organization).where(eq(organization.id, ctx.organization.id));
  const email = `${uid()}@example.com`;
  const appt = await createAppointment({
    org,
    serviceId: svc.id,
    staffId: ctx.staffId!,
    startsAt: new Date(Date.now() - (opts.hoursAgo ?? 5) * HOUR),
    source: "manual",
    customer: { firstName: "Léa", lastName: "Martin", email, phone: null },
    actor: { kind: "staff", email: ctx.user.email },
    enforceSchedule: false,
  });
  return { ctx: { ...ctx, organization: org }, org, appt, email, token: createReviewToken(appt.id) };
}

async function loadDispatcher() {
  vi.resetModules();
  return (await import("@/server/notifications/dispatch")).processDueNotifications;
}

describe("avis clients", () => {
  it("demande d'avis programmée 2 h après la fin, envoyée une seule fois avec un lien signé", async () => {
    const { appt, email } = await pastBooking();
    const [req] = await db
      .select()
      .from(notification)
      .where(and(eq(notification.appointmentId, appt.id), eq(notification.type, "review_request")));
    expect(req.scheduledFor.getTime()).toBe(appt.endsAt.getTime() + 2 * HOUR);
    const process = await loadDispatcher();
    await process();
    await process();
    const mails = await db.select().from(emailMessage).where(eq(emailMessage.to, email));
    const asks = mails.filter((m) => m.template === "review_request");
    expect(asks).toHaveLength(1);
    expect(asks[0].subject).toMatch(/^Votre avis sur /);
    expect(asks[0].text).toMatch(new RegExp(`/avis/${appt.id}\\.[A-Za-z0-9_-]{32}`));
  });

  it("forfait Free : pas de demande par email", async () => {
    const { appt } = await pastBooking({ plan: "free" });
    const rows = await db
      .select()
      .from(notification)
      .where(and(eq(notification.appointmentId, appt.id), eq(notification.type, "review_request")));
    expect(rows).toHaveLength(0);
  });

  it("rendez-vous annulé : la demande n'est pas envoyée et l'avis est refusé", async () => {
    const { org, appt, email, token } = await pastBooking();
    await cancelAppointment({
      org,
      appointmentId: appt.id,
      by: "staff",
      actor: { kind: "staff", email: "x@example.com" },
    }).catch(() => {});
    await db.update(appointment).set({ status: "cancelled" }).where(eq(appointment.id, appt.id));
    const process = await loadDispatcher();
    await process();
    const mails = await db.select().from(emailMessage).where(eq(emailMessage.to, email));
    expect(mails.some((m) => m.template === "review_request")).toBe(false);
    expect((await getReviewView(token))?.state).toBe("unavailable");
    await expect(submitReview(token, { rating: 5 })).rejects.toThrow(/ne peut pas recevoir/);
  });

  it("dépôt : publié immédiatement, un seul avis par rendez-vous, lien falsifié refusé", async () => {
    const { org, appt, token } = await pastBooking();
    expect((await getReviewView(token))?.state).toBe("open");
    await submitReview(token, { rating: 4, comment: "  Très bon accueil  " });
    await expect(submitReview(token, { rating: 1 })).rejects.toThrow(/déjà donné/);
    expect((await getReviewView(token))?.state).toBe("done");

    const forged = `${appt.id}.${"A".repeat(32)}`;
    expect(await getReviewView(forged)).toBeNull();
    await expect(submitReview(forged, { rating: 5 })).rejects.toThrow(/invalide/);
    await expect(submitReview(token.replace(/.$/, "x"), { rating: 5 })).rejects.toThrow();

    const [pub] = await listPublicReviews(org.id);
    expect(pub).toMatchObject({ rating: 4, comment: "Très bon accueil", author: "Léa M." });
    expect(JSON.stringify(pub)).not.toContain("Martin");
    expect(JSON.stringify(pub)).not.toContain("@example.com");
    expect((await getRatingSummaries([org.id])).get(org.id)).toEqual({ average: 4, count: 1 });
  });

  it("refus avant la fin du rendez-vous, note invalide refusée", async () => {
    const { token } = await pastBooking({ hoursAgo: -24 });
    expect((await getReviewView(token))?.state).toBe("too_early");
    await expect(submitReview(token, { rating: 5 })).rejects.toThrow(/après votre rendez-vous/);
    const past = await pastBooking();
    await expect(submitReview(past.token, { rating: 6 })).rejects.toThrow();
    await expect(submitReview(past.token, { rating: 0 })).rejects.toThrow();
  });

  it("réponse publique et masquage motivé par le professionnel ; isolation entre entreprises", async () => {
    const { ctx, org, token } = await pastBooking();
    const other = await pastBooking();
    await submitReview(token, { rating: 2, comment: "Attente trop longue" });
    const [r] = await listOrgReviews(ctx);
    await replyToReview(ctx, { reviewId: r.id, reply: "Désolés, nous nous améliorons." });
    expect((await listPublicReviews(org.id))[0].reply).toBe("Désolés, nous nous améliorons.");

    // Une autre entreprise ne peut ni répondre ni masquer.
    await expect(replyToReview(other.ctx, { reviewId: r.id, reply: "x" })).rejects.toThrow(
      /introuvable/,
    );
    await expect(
      setReviewVisibility(other.ctx, { reviewId: r.id, visible: false, reason: "spam" }),
    ).rejects.toThrow(/introuvable/);

    // Masquage : motif obligatoire, conservé ; l'avis disparaît de la page et de la moyenne.
    await expect(
      setReviewVisibility(ctx, { reviewId: r.id, visible: false } as never),
    ).rejects.toThrow();
    await setReviewVisibility(ctx, { reviewId: r.id, visible: false, reason: "off_topic" });
    const [hidden] = await db.select().from(review).where(eq(review.id, r.id));
    expect(hidden).toMatchObject({
      status: "hidden",
      hiddenReason: "Sans rapport avec la prestation",
    });
    expect(await listPublicReviews(org.id)).toHaveLength(0);
    expect((await getRatingSummaries([org.id])).get(org.id)).toBeUndefined();
    await setReviewVisibility(ctx, { reviewId: r.id, visible: true });
    expect(await listPublicReviews(org.id)).toHaveLength(1);
  });

  it("un employé ne gère pas les avis", async () => {
    const { ctx } = await pastBooking();
    const employee = await makeUser("Employé Test");
    const empCtx = { ...(await ctxFor(employee, ctx.organization.id)), role: "employee" as const };
    await expect(listOrgReviews(empCtx)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
