import "server-only";
import { and, asc, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import {
  autopilotAction,
  customer,
  organization,
  service,
  staff,
  waitlistEntry,
  waitlistOffer,
} from "@/db/schema";
import { isAutomationActive } from "@/domain/autopilot/automations";
import { addDays, localDateOf } from "@/domain/availability/engine";
import { effectivePlan, type Plan } from "@/domain/billing/plans";
import { assertCan, ForbiddenError } from "@/domain/permissions";
import { optionalPhone, optionalText } from "@/domain/validation";
import { TIME_RANGES, type TimeRange } from "@/domain/waitlist/match";
import { env } from "@/lib/env";
import {
  capitalize,
  formatCents,
  formatDateLong,
  formatDuration,
  formatInTz,
  formatTime,
} from "@/lib/format";
import { createManageToken, createOfferToken, verifyOfferToken } from "@/lib/manage-token";
import type { OrgContext } from "@/server/auth/session";
import { loadStoredRules } from "@/server/autopilot/rules";
import type { OrgRow } from "@/server/booking/availability";
import { createAppointment, SlotTakenError } from "@/server/booking/book";
import { findOrCreateCustomer } from "@/server/customers/core";
import { waitlistOfferEmail } from "@/server/email/booking-templates";
import { sendEmail } from "@/server/email/send";
import { NotFoundError, UserError } from "@/server/errors";
import { offerFreedSlot } from "./offers";

const MAX_DAYS = 90;
const MAX_ACTIVE_PER_CUSTOMER = 3;
const MAX_SEND_ATTEMPTS = 5;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export const waitlistInputSchema = z
  .object({
    firstName: z.string().trim().min(1, "Indiquez le prénom.").max(60),
    lastName: z.string().trim().min(1, "Indiquez le nom.").max(60),
    email: z.string().trim().toLowerCase().pipe(z.email("Adresse email invalide.")),
    phone: optionalPhone,
    serviceId: z.uuid("Choisissez une prestation."),
    staffId: z.uuid().nullable().default(null),
    dateFrom: isoDate,
    dateTo: isoDate,
    weekdays: z.array(z.number().int().min(1).max(7)).max(7).default([]),
    timeRange: z.enum(Object.keys(TIME_RANGES) as [TimeRange, ...TimeRange[]]).default("any"),
    note: optionalText(300, "Le message"),
  })
  .refine((d) => d.dateFrom <= d.dateTo, {
    path: ["dateTo"],
    message: "La date de fin doit suivre la date de début.",
  });

export type WaitlistInput = z.input<typeof waitlistInputSchema>;

export function waitlistEnabled(org: OrgRow, stored: Awaited<ReturnType<typeof loadStoredRules>>) {
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  return isAutomationActive("waitlist", plan.id, stored);
}

async function insertEntry(
  org: OrgRow,
  plan: Plan,
  input: WaitlistInput,
  source: "staff" | "online",
) {
  const data = waitlistInputSchema.parse(input);
  const today = localDateOf(new Date(), org.timezone);
  if (data.dateFrom < today)
    throw new UserError("La période doit commencer aujourd'hui ou plus tard.", {
      dateFrom: "Date passée.",
    });
  if (data.dateTo > addDays(today, MAX_DAYS))
    throw new UserError(`La période est limitée aux ${MAX_DAYS} prochains jours.`, {
      dateTo: `${MAX_DAYS} jours maximum.`,
    });
  const [svc] = await db
    .select({ id: service.id, isOnlineBookable: service.isOnlineBookable })
    .from(service)
    .where(
      and(
        eq(service.id, data.serviceId),
        eq(service.organizationId, org.id),
        eq(service.isActive, true),
        sql`${service.deletedAt} is null`,
      ),
    );
  if (!svc || (source === "online" && !svc.isOnlineBookable))
    throw new UserError("Prestation introuvable.");
  if (data.staffId) {
    const [s] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(
        and(eq(staff.id, data.staffId), eq(staff.organizationId, org.id), eq(staff.isActive, true)),
      );
    if (!s) throw new UserError("Employé introuvable.");
  }
  const range = TIME_RANGES[data.timeRange];
  return db.transaction(async (tx) => {
    const cust = await findOrCreateCustomer(tx, org.id, plan, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone ?? null,
    });
    const active = await tx
      .select({ id: waitlistEntry.id })
      .from(waitlistEntry)
      .where(
        and(
          eq(waitlistEntry.organizationId, org.id),
          eq(waitlistEntry.customerId, cust.id),
          eq(waitlistEntry.status, "active"),
        ),
      );
    if (active.length >= MAX_ACTIVE_PER_CUSTOMER)
      throw new UserError(
        `Ce client est déjà inscrit ${MAX_ACTIVE_PER_CUSTOMER} fois sur la liste d'attente.`,
      );
    const [entry] = await tx
      .insert(waitlistEntry)
      .values({
        organizationId: org.id,
        customerId: cust.id,
        serviceId: data.serviceId,
        staffId: data.staffId,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        weekdays: [...new Set(data.weekdays)].sort(),
        fromMinute: range.from,
        toMinute: range.to,
        note: data.note ?? null,
        source,
      })
      .returning();
    return entry;
  });
}

function assertPro(ctx: OrgContext) {
  if (ctx.plan.id !== "pro")
    throw new ForbiddenError("La liste d'attente intelligente est incluse dans le forfait Pro.");
}

/** Inscription par le professionnel. */
export async function addWaitlistEntry(ctx: OrgContext, input: WaitlistInput) {
  assertCan(ctx.role, "customers.manage");
  assertPro(ctx);
  return insertEntry(ctx.organization, ctx.plan, input, "staff");
}

/** Inscription par le client depuis la page publique de réservation. */
export async function joinWaitlistPublic(org: OrgRow, input: WaitlistInput) {
  const stored = await loadStoredRules(db, org.id);
  if (!org.bookingEnabled || !waitlistEnabled(org, stored))
    throw new UserError("La liste d'attente n'est pas disponible pour cet établissement.");
  return insertEntry(org, effectivePlan(org.plan, org.subscriptionStatus), input, "online");
}

export async function cancelWaitlistEntry(ctx: OrgContext, entryId: string) {
  assertCan(ctx.role, "customers.manage");
  await db.transaction(async (tx) => {
    const [entry] = await tx
      .update(waitlistEntry)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(waitlistEntry.id, entryId),
          eq(waitlistEntry.organizationId, ctx.organization.id),
          eq(waitlistEntry.status, "active"),
        ),
      )
      .returning();
    if (!entry) throw new NotFoundError("Inscription introuvable ou déjà terminée.");
    await tx
      .update(waitlistOffer)
      .set({ status: "superseded", decidedAt: new Date() })
      .where(and(eq(waitlistOffer.entryId, entryId), eq(waitlistOffer.status, "pending")));
  });
}

export async function listWaitlist(ctx: OrgContext) {
  assertCan(ctx.role, "customers.view_all");
  const entries = await db
    .select({
      id: waitlistEntry.id,
      status: waitlistEntry.status,
      source: waitlistEntry.source,
      dateFrom: waitlistEntry.dateFrom,
      dateTo: waitlistEntry.dateTo,
      weekdays: waitlistEntry.weekdays,
      fromMinute: waitlistEntry.fromMinute,
      toMinute: waitlistEntry.toMinute,
      note: waitlistEntry.note,
      createdAt: waitlistEntry.createdAt,
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      serviceName: service.name,
      staffName: staff.displayName,
    })
    .from(waitlistEntry)
    .innerJoin(customer, eq(customer.id, waitlistEntry.customerId))
    .innerJoin(service, eq(service.id, waitlistEntry.serviceId))
    .leftJoin(staff, eq(staff.id, waitlistEntry.staffId))
    .where(eq(waitlistEntry.organizationId, ctx.organization.id))
    .orderBy(
      sql`case when ${waitlistEntry.status} = 'active' then 0 else 1 end`,
      asc(waitlistEntry.createdAt),
    )
    .limit(200);
  const offers = entries.length
    ? await db
        .select({
          id: waitlistOffer.id,
          entryId: waitlistOffer.entryId,
          startsAt: waitlistOffer.startsAt,
          expiresAt: waitlistOffer.expiresAt,
          status: waitlistOffer.status,
          notifiedAt: waitlistOffer.notifiedAt,
          staffName: staff.displayName,
        })
        .from(waitlistOffer)
        .innerJoin(staff, eq(staff.id, waitlistOffer.staffId))
        .where(
          and(
            eq(waitlistOffer.organizationId, ctx.organization.id),
            inArray(
              waitlistOffer.entryId,
              entries.map((e) => e.id),
            ),
          ),
        )
        .orderBy(desc(waitlistOffer.createdAt))
    : [];
  return entries.map((e) => ({ ...e, offers: offers.filter((o) => o.entryId === e.id) }));
}

/* ───────────────────────── Propositions (lien public) ───────────────────────── */

async function loadOffer(offerId: string) {
  const [row] = await db
    .select({
      offer: waitlistOffer,
      entry: waitlistEntry,
      org: organization,
      cust: customer,
      svc: service,
      staffName: staff.displayName,
    })
    .from(waitlistOffer)
    .innerJoin(waitlistEntry, eq(waitlistEntry.id, waitlistOffer.entryId))
    .innerJoin(organization, eq(organization.id, waitlistOffer.organizationId))
    .innerJoin(customer, eq(customer.id, waitlistEntry.customerId))
    .innerJoin(service, eq(service.id, waitlistEntry.serviceId))
    .innerJoin(staff, eq(staff.id, waitlistOffer.staffId))
    .where(eq(waitlistOffer.id, offerId))
    .limit(1);
  return row ?? null;
}

export type OfferView = {
  status: "pending" | "accepted" | "expired" | "taken";
  organizationName: string;
  slug: string;
  customerFirstName: string;
  serviceName: string;
  staffName: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  priceLabel: string | null;
  expiresLabel: string;
  manageToken: string | null;
};

export async function getOfferView(token: string): Promise<OfferView | null> {
  const offerId = verifyOfferToken(token);
  if (!offerId) return null;
  const row = await loadOffer(offerId);
  if (!row) return null;
  const { offer, org, cust, svc } = row;
  const tz = org.timezone;
  const status =
    offer.status === "accepted"
      ? "accepted"
      : offer.status === "superseded"
        ? "taken"
        : offer.status === "expired" || offer.expiresAt <= new Date()
          ? "expired"
          : "pending";
  return {
    status,
    organizationName: org.name,
    slug: org.slug,
    customerFirstName: cust.firstName,
    serviceName: svc.name,
    staffName: row.staffName,
    dateLabel: capitalize(formatDateLong(offer.startsAt, tz)),
    timeLabel: formatTime(offer.startsAt, tz),
    durationLabel: formatDuration(svc.durationMinutes),
    priceLabel: svc.priceCents ? formatCents(svc.priceCents) : null,
    expiresLabel: formatInTz(offer.expiresAt, tz, "EEEE d MMMM 'à' HH:mm"),
    manageToken: offer.appointmentId ? createManageToken(offer.appointmentId) : null,
  };
}

/**
 * Le client confirme une proposition. Le rendez-vous est créé avec toutes les vérifications
 * habituelles ; la proposition est marquée acceptée DANS la même transaction. Si un autre client
 * a confirmé juste avant, la contrainte anti-chevauchement fait échouer cette réservation.
 */
export async function acceptOffer(token: string) {
  const offerId = verifyOfferToken(token);
  if (!offerId) throw new UserError("Lien invalide.");
  const row = await loadOffer(offerId);
  if (!row) throw new UserError("Proposition introuvable.");
  const { offer, entry, org } = row;
  if (offer.status === "accepted") return { manageToken: createManageToken(offer.appointmentId!) };
  if (offer.status !== "pending" || offer.expiresAt <= new Date())
    throw new UserError("Cette proposition n'est plus valable.");
  const stored = await loadStoredRules(db, org.id);
  if (!waitlistEnabled(org, stored)) throw new UserError("Cette proposition n'est plus valable.");

  try {
    const appt = await createAppointment({
      org,
      serviceId: entry.serviceId,
      staffId: offer.staffId,
      startsAt: offer.startsAt,
      source: "online",
      allowOffline: true,
      customer: { id: entry.customerId },
      actor: { kind: "customer" },
      enforceSchedule: true,
      onCreated: async (tx, created) => {
        const now = new Date();
        const [won] = await tx
          .update(waitlistOffer)
          .set({ status: "accepted", appointmentId: created.id, decidedAt: now })
          .where(
            and(
              eq(waitlistOffer.id, offer.id),
              eq(waitlistOffer.status, "pending"),
              sql`${waitlistOffer.expiresAt} > now()`,
            ),
          )
          .returning();
        if (!won) throw new UserError("Cette proposition n'est plus valable.");
        // Les autres personnes prévenues pour ce créneau ne peuvent plus le prendre.
        await tx
          .update(waitlistOffer)
          .set({ status: "superseded", decidedAt: now })
          .where(
            and(
              eq(waitlistOffer.organizationId, org.id),
              eq(waitlistOffer.staffId, offer.staffId),
              eq(waitlistOffer.startsAt, offer.startsAt),
              eq(waitlistOffer.status, "pending"),
            ),
          );
        await tx
          .update(waitlistEntry)
          .set({ status: "booked" })
          .where(eq(waitlistEntry.id, entry.id));
        await tx.insert(autopilotAction).values({
          organizationId: org.id,
          source: "waitlist",
          kind: "waitlist.booked",
          status: "done",
          summary: `${row.cust.firstName} ${row.cust.lastName} a obtenu le créneau du ${formatInTz(offer.startsAt, org.timezone, "EEE d MMM 'à' HH:mm")} via la liste d'attente`,
          payload: { offerId: offer.id, appointmentId: created.id },
          decidedAt: now,
        });
      },
    });
    return { manageToken: createManageToken(appt.id) };
  } catch (error) {
    if (error instanceof SlotTakenError) {
      await db
        .update(waitlistOffer)
        .set({ status: "superseded", decidedAt: new Date() })
        .where(and(eq(waitlistOffer.id, offer.id), eq(waitlistOffer.status, "pending")));
      throw new UserError("Ce créneau vient d'être réservé par un autre client.");
    }
    throw error;
  }
}

/* ───────────────────────── Traitement planifié ───────────────────────── */

async function sendOffer(offerId: string) {
  const row = await loadOffer(offerId);
  if (!row) return "skipped" as const;
  const { offer, org, cust, svc } = row;
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  const stored = await loadStoredRules(db, org.id);
  if (!isAutomationActive("waitlist", plan.id, stored) || !cust.email) {
    await db
      .update(waitlistOffer)
      .set({
        status: "expired",
        decidedAt: new Date(),
        lastError: cust.email ? "Liste d'attente désactivée" : "Client sans adresse email",
      })
      .where(eq(waitlistOffer.id, offer.id));
    return "skipped" as const;
  }
  const tz = org.timezone;
  const today = localDateOf(new Date(), tz);
  const expiresDay = localDateOf(offer.expiresAt, tz);
  const email = waitlistOfferEmail({
    organizationName: org.name,
    organizationAddress:
      [org.addressLine1, [org.postalCode, org.city].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ") || null,
    customerFirstName: cust.firstName,
    serviceName: svc.name,
    staffName: row.staffName,
    dateLabel: capitalize(formatDateLong(offer.startsAt, tz)),
    timeLabel: formatTime(offer.startsAt, tz),
    durationLabel: formatDuration(svc.durationMinutes),
    priceLabel: svc.priceCents ? formatCents(svc.priceCents) : null,
    acceptUrl: `${env.NEXT_PUBLIC_APP_URL}/liste-attente/${createOfferToken(offer.id)}`,
    expiresLabel:
      expiresDay === today
        ? `aujourd'hui à ${formatTime(offer.expiresAt, tz)}`
        : formatInTz(offer.expiresAt, tz, "EEEE d MMMM 'à' HH:mm"),
    brandColor: plan.features.bookingPageCustomization ? org.brandColor : null,
  });
  const result = await sendEmail(cust.email, email);
  if (result.status === "failed") {
    await db
      .update(waitlistOffer)
      .set({
        notifiedAt: null,
        attempts: sql`${waitlistOffer.attempts} + 1`,
        lastError: "Échec d'envoi de l'email",
      })
      .where(eq(waitlistOffer.id, offer.id));
    return "failed" as const;
  }
  await db
    .update(waitlistOffer)
    .set({
      notifiedAt: new Date(),
      attempts: sql`${waitlistOffer.attempts} + 1`,
      lastError:
        result.status === "logged"
          ? "Aucun fournisseur d'email configuré : email journalisé, non envoyé"
          : null,
    })
    .where(eq(waitlistOffer.id, offer.id));
  return "sent" as const;
}

/**
 * Tâche planifiée (toutes les 5 minutes) et après chaque annulation :
 * 1. propositions expirées → créneau proposé aux inscrits suivants ;
 * 2. inscriptions dont la période est passée → expirées ;
 * 3. envoi des emails de proposition (avec nouvelles tentatives).
 */
export async function processWaitlist(now = new Date()) {
  const stats = { expired: 0, reoffered: 0, sent: 0, failed: 0 };

  const expired = await db
    .update(waitlistOffer)
    .set({ status: "expired", decidedAt: now })
    .where(and(eq(waitlistOffer.status, "pending"), lt(waitlistOffer.expiresAt, now)))
    .returning();
  stats.expired = expired.length;
  const slots = new Map<string, { organizationId: string; staffId: string; startsAt: Date }>();
  for (const o of expired)
    slots.set(`${o.organizationId}|${o.staffId}|${o.startsAt.toISOString()}`, o);
  for (const slot of slots.values()) {
    if (slot.startsAt <= now) continue;
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, slot.organizationId));
    if (!org) continue;
    await db.transaction(async (tx) => {
      await tx.insert(autopilotAction).values({
        organizationId: org.id,
        source: "waitlist",
        kind: "waitlist.expired",
        status: "expired",
        summary: `Proposition du ${formatInTz(slot.startsAt, org.timezone, "EEE d MMM 'à' HH:mm")} expirée sans réponse`,
        payload: { staffId: slot.staffId, startsAt: slot.startsAt.toISOString() },
        decidedAt: now,
      });
      stats.reoffered += await offerFreedSlot(tx, org, slot, now);
    });
  }

  await db
    .update(waitlistEntry)
    .set({ status: "expired" })
    .where(
      and(
        eq(waitlistEntry.status, "active"),
        lt(waitlistEntry.dateTo, sql`(now() at time zone 'utc')::date - 1`),
      ),
    );

  // Réservation atomique des propositions à envoyer : deux exécutions simultanées n'envoient jamais
  // le même email (SKIP LOCKED), et un échec libère la proposition pour une nouvelle tentative.
  const toSend = await db.transaction(async (tx) => {
    const due = await tx
      .select({ id: waitlistOffer.id })
      .from(waitlistOffer)
      .where(
        and(
          eq(waitlistOffer.status, "pending"),
          sql`${waitlistOffer.notifiedAt} is null`,
          lt(waitlistOffer.attempts, MAX_SEND_ATTEMPTS),
          gt(waitlistOffer.expiresAt, now),
        ),
      )
      .orderBy(asc(waitlistOffer.createdAt))
      .limit(50)
      .for("update", { skipLocked: true });
    if (!due.length) return [];
    await tx
      .update(waitlistOffer)
      .set({ notifiedAt: now })
      .where(
        inArray(
          waitlistOffer.id,
          due.map((d) => d.id),
        ),
      );
    return due;
  });
  for (const { id } of toSend) {
    try {
      const r = await sendOffer(id);
      if (r === "sent") stats.sent++;
      else if (r === "failed") stats.failed++;
    } catch (error) {
      console.error("[liste d'attente] envoi impossible", id, error);
      await db
        .update(waitlistOffer)
        .set({ notifiedAt: null, attempts: sql`${waitlistOffer.attempts} + 1` })
        .where(eq(waitlistOffer.id, id));
      stats.failed++;
    }
  }
  return stats;
}
