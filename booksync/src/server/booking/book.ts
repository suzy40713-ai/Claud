import "server-only";
import { TZDate } from "@date-fns/tz";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { appointment, customer, organization, service, staff, usageCounter } from "@/db/schema";
import { isSlotAvailable, localDateOf, pickStaff } from "@/domain/availability/engine";
import {
  effectivePlan,
  hasRoom,
  LIMIT_MESSAGES,
  PlanLimitError,
  type Plan,
} from "@/domain/billing/plans";
import { optionalPhone, optionalText } from "@/domain/validation";
import { findOrCreateCustomer } from "@/server/customers/core";
import { pgErrorCode, UserError } from "@/server/errors";
import { enqueueBookingNotifications, type NotifyContext } from "@/server/notifications/queue";
import { offerFreedSlot } from "@/server/waitlist/offers";
import { loadAvailabilityInput, staffForService } from "./availability";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class SlotTakenError extends UserError {
  constructor() {
    super("Ce créneau vient d'être réservé par quelqu'un d'autre. Choisissez un autre horaire.");
    this.name = "SlotTakenError";
  }
}

/** Période de comptage AAAA-MM dans le fuseau de l'entreprise (le compteur repart à zéro chaque mois). */
export function usagePeriod(now: Date, timeZone: string) {
  const t = new TZDate(now.getTime(), timeZone);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Réserve une place dans le quota mensuel. La ligne du compteur est verrouillée jusqu'à la fin
 * de la transaction : deux réservations simultanées ne peuvent pas dépasser la limite.
 */
async function consumeBookingQuota(tx: Tx, organizationId: string, plan: Plan, timeZone: string) {
  const period = usagePeriod(new Date(), timeZone);
  const [row] = await tx
    .insert(usageCounter)
    .values({ organizationId, period, bookings: 0 })
    .onConflictDoUpdate({
      target: [usageCounter.organizationId, usageCounter.period],
      set: { updatedAt: new Date() },
    })
    .returning({ bookings: usageCounter.bookings });
  if (!hasRoom(plan.limits.bookingsPerMonth, row.bookings)) {
    throw new PlanLimitError("bookings", LIMIT_MESSAGES.bookings(plan));
  }
  await tx
    .update(usageCounter)
    .set({ bookings: sql`${usageCounter.bookings} + 1` })
    .where(and(eq(usageCounter.organizationId, organizationId), eq(usageCounter.period, period)));
}

export async function getMonthlyUsage(organizationId: string, timeZone: string) {
  const [row] = await db
    .select({ bookings: usageCounter.bookings })
    .from(usageCounter)
    .where(
      and(
        eq(usageCounter.organizationId, organizationId),
        eq(usageCounter.period, usagePeriod(new Date(), timeZone)),
      ),
    );
  return row?.bookings ?? 0;
}

export const publicBookingSchema = z.object({
  serviceId: z.uuid("Service invalide."),
  staffId: z.uuid().nullable(),
  startsAt: z.iso.datetime({ message: "Horaire invalide." }),
  firstName: z.string().trim().min(1, "Indiquez votre prénom.").max(60),
  lastName: z.string().trim().min(1, "Indiquez votre nom.").max(60),
  email: z.string().trim().toLowerCase().pipe(z.email("Adresse email invalide.")),
  phone: optionalPhone,
  note: optionalText(500, "Le message"),
  emailOptIn: z.boolean().default(true),
});

type CreateArgs = {
  org: typeof organization.$inferSelect;
  serviceId: string;
  staffId: string | null;
  startsAt: Date;
  source: "online" | "manual";
  customer:
    | { id: string }
    | {
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        emailOptIn?: boolean;
      };
  customerNote?: string | null;
  internalNote?: string | null;
  createdByUserId?: string | null;
  actor: NotifyContext["actor"];
  /** Réservation manuelle : autorisée hors horaires/délai, mais jamais en chevauchement. */
  enforceSchedule: boolean;
  /** Créneau proposé par la liste d'attente : la prestation peut ne pas être réservable en ligne. */
  allowOffline?: boolean;
  /** Exécuté dans la même transaction, après la création (annule tout en cas d'erreur). */
  onCreated?: (tx: Tx, appt: typeof appointment.$inferSelect) => Promise<void>;
};

/**
 * Crée un rendez-vous en une transaction :
 * 1. vérifie le service et l'employé ; 2. re-calcule la disponibilité côté serveur ;
 * 3. consomme le quota mensuel ; 4. crée ou retrouve le client ; 5. insère le rendez-vous —
 * la contrainte d'exclusion PostgreSQL garantit l'absence de double réservation, même en cas
 * de requêtes simultanées ; 6. programme les notifications.
 */
export async function createAppointment(args: CreateArgs) {
  const { org } = args;
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  try {
    return await db.transaction(async (tx) => {
      const [svc] = await tx
        .select()
        .from(service)
        .where(
          and(
            eq(service.id, args.serviceId),
            eq(service.organizationId, org.id),
            isNull(service.deletedAt),
          ),
        )
        .limit(1);
      if (
        !svc ||
        !svc.isActive ||
        (args.source === "online" && !svc.isOnlineBookable && !args.allowOffline)
      ) {
        throw new UserError("Ce service n'est pas disponible à la réservation.");
      }
      const eligible = await staffForService(tx, org.id, svc.id);
      let candidates = eligible.map((s) => s.id);
      if (args.staffId) {
        if (args.source === "manual") {
          // En réservation manuelle, tout employé actif de l'entreprise peut être choisi.
          const [s] = await tx
            .select({ id: staff.id })
            .from(staff)
            .where(
              and(
                eq(staff.id, args.staffId),
                eq(staff.organizationId, org.id),
                eq(staff.isActive, true),
              ),
            );
          if (!s) throw new UserError("Employé indisponible.");
        } else if (!candidates.includes(args.staffId)) {
          throw new UserError("Cet employé ne réalise pas ce service.");
        }
        candidates = [args.staffId];
      }
      if (!candidates.length)
        throw new UserError("Aucun employé ne réalise ce service pour le moment.");

      const date = localDateOf(args.startsAt, org.timezone);
      let staffId = candidates[0];
      if (args.enforceSchedule) {
        const input = await loadAvailabilityInput(tx, org, svc, candidates, date, date);
        const available = candidates.filter((id) => isSlotAvailable(input, args.startsAt, id));
        if (!available.length) throw new SlotTakenError();
        staffId =
          available.length === 1
            ? available[0]
            : pickStaff(
                available,
                Object.fromEntries(input.staff.map((s) => [s.id, s.busy])),
                date,
                org.timezone,
              );
      }

      await consumeBookingQuota(tx, org.id, plan, org.timezone);

      const cust =
        "id" in args.customer
          ? (
              await tx
                .select()
                .from(customer)
                .where(and(eq(customer.id, args.customer.id), eq(customer.organizationId, org.id)))
                .limit(1)
            )[0]
          : await findOrCreateCustomer(tx, org.id, plan, args.customer);
      if (!cust) throw new UserError("Client introuvable.");

      const endsAt = new Date(args.startsAt.getTime() + svc.durationMinutes * 60_000);
      const [appt] = await tx
        .insert(appointment)
        .values({
          organizationId: org.id,
          staffId,
          serviceId: svc.id,
          customerId: cust.id,
          startsAt: args.startsAt,
          endsAt,
          blockedUntil: new Date(endsAt.getTime() + svc.bufferAfterMinutes * 60_000),
          source: args.source,
          serviceName: svc.name,
          priceCents: svc.priceCents,
          customerNote: args.customerNote ?? null,
          internalNote: args.internalNote ?? null,
          createdByUserId: args.createdByUserId ?? null,
        })
        .returning();

      await enqueueBookingNotifications(tx, "created", {
        organization: org,
        plan,
        appointment: appt,
        customer: cust,
        actor: args.actor,
      });
      await args.onCreated?.(tx, appt);
      return appt;
    });
  } catch (error) {
    if (pgErrorCode(error) === "23P01") throw new SlotTakenError();
    throw error;
  }
}

/** Déplace un rendez-vous (même service) ; la disponibilité est re-vérifiée en excluant le rendez-vous lui-même. */
export async function rescheduleAppointment(args: {
  org: typeof organization.$inferSelect;
  appointmentId: string;
  startsAt: Date;
  staffId?: string | null;
  enforceSchedule: boolean;
  actor: NotifyContext["actor"];
}) {
  const { org } = args;
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(appointment)
        .where(and(eq(appointment.id, args.appointmentId), eq(appointment.organizationId, org.id)))
        .for("update")
        .limit(1);
      if (!current) throw new UserError("Rendez-vous introuvable.");
      if (current.status !== "confirmed")
        throw new UserError("Ce rendez-vous ne peut plus être modifié.");
      const staffId = args.staffId ?? current.staffId;
      const duration = current.endsAt.getTime() - current.startsAt.getTime();
      const buffer = current.blockedUntil.getTime() - current.endsAt.getTime();
      if (args.enforceSchedule) {
        const svc = { durationMinutes: duration / 60_000, bufferAfterMinutes: buffer / 60_000 };
        const date = localDateOf(args.startsAt, org.timezone);
        const input = await loadAvailabilityInput(tx, org, svc, [staffId], date, date, {
          excludeAppointmentId: current.id,
        });
        if (!isSlotAvailable(input, args.startsAt, staffId)) throw new SlotTakenError();
      }
      const endsAt = new Date(args.startsAt.getTime() + duration);
      const [updated] = await tx
        .update(appointment)
        .set({
          startsAt: args.startsAt,
          endsAt,
          blockedUntil: new Date(endsAt.getTime() + buffer),
          staffId,
        })
        .where(eq(appointment.id, current.id))
        .returning();
      const [cust] = await tx.select().from(customer).where(eq(customer.id, current.customerId));
      await enqueueBookingNotifications(tx, "rescheduled", {
        organization: org,
        plan,
        appointment: updated,
        customer: cust,
        actor: args.actor,
      });
      // L'ancien horaire est libre : proposé à la liste d'attente.
      await offerFreedSlot(tx, org, { staffId: current.staffId, startsAt: current.startsAt });
      return updated;
    });
  } catch (error) {
    if (pgErrorCode(error) === "23P01") throw new SlotTakenError();
    throw error;
  }
}

export async function cancelAppointment(args: {
  org: typeof organization.$inferSelect;
  appointmentId: string;
  by: "customer" | "staff";
  reason?: string | null;
  actor: NotifyContext["actor"];
}) {
  const { org } = args;
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(appointment)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: args.by,
        cancellationReason: args.reason ?? null,
      })
      .where(
        and(
          eq(appointment.id, args.appointmentId),
          eq(appointment.organizationId, org.id),
          eq(appointment.status, "confirmed"),
        ),
      )
      .returning();
    if (!updated) throw new UserError("Ce rendez-vous est déjà annulé ou terminé.");
    const [cust] = await tx.select().from(customer).where(eq(customer.id, updated.customerId));
    await enqueueBookingNotifications(tx, "cancelled", {
      organization: org,
      plan,
      appointment: updated,
      customer: cust,
      actor: args.actor,
    });
    await offerFreedSlot(tx, org, { staffId: updated.staffId, startsAt: updated.startsAt });
    return updated;
  });
}
