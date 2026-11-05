"use server";

import { headers } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { service } from "@/db/schema";
import { addDays } from "@/domain/availability/engine";
import { PlanLimitError } from "@/domain/billing/plans";
import { createManageToken } from "@/lib/manage-token";
import { getAvailability, staffForService } from "@/server/booking/availability";
import { createAppointment, publicBookingSchema } from "@/server/booking/book";
import { getOrgBySlug } from "@/server/booking/public";
import { runAction, UserError } from "@/server/errors";
import { dispatchSoon } from "@/server/notifications/dispatch";
import { clientIp, rateLimit } from "@/server/rate-limit";

const slotsSchema = z.object({
  serviceId: z.uuid(),
  staffId: z.uuid().nullable(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().int().min(1).max(14),
});

/** Créneaux disponibles (instant ISO + employés) sur une période, calculés côté serveur. */
export async function getSlotsAction(slug: string, input: z.input<typeof slotsSchema>) {
  return runAction(async () => {
    const ip = clientIp(await headers());
    if (!rateLimit(`slots:${ip}`, 120, 60_000)) throw new UserError("Trop de requêtes. Patientez quelques secondes.");
    const data = slotsSchema.parse(input);
    const org = await getOrgBySlug(slug);
    if (!org || !org.bookingEnabled) throw new UserError("La réservation en ligne n'est pas disponible.");
    const [svc] = await db
      .select()
      .from(service)
      .where(and(eq(service.id, data.serviceId), eq(service.organizationId, org.id), eq(service.isActive, true), eq(service.isOnlineBookable, true), isNull(service.deletedAt)));
    if (!svc) throw new UserError("Service introuvable.");
    const eligible = (await staffForService(db, org.id, svc.id)).map((s) => s.id);
    const staffIds = data.staffId ? eligible.filter((id) => id === data.staffId) : eligible;
    const days = await getAvailability(org, svc, staffIds, data.fromDate, addDays(data.fromDate, data.days - 1));
    return days.map((d) => ({ date: d.date, slots: d.slots.map((s) => ({ start: s.start.toISOString(), staffIds: s.staffIds })) }));
  });
}

export async function bookAction(slug: string, input: z.input<typeof publicBookingSchema> & { website?: string }) {
  return runAction(async () => {
    // Champ piège invisible : rempli uniquement par les robots.
    if (input.website) throw new UserError("Réservation refusée.");
    const ip = clientIp(await headers());
    if (!rateLimit(`book:${ip}`, 8, 10 * 60_000)) {
      throw new UserError("Trop de réservations depuis cette connexion. Réessayez dans quelques minutes.");
    }
    const data = publicBookingSchema.parse(input);
    const org = await getOrgBySlug(slug);
    if (!org || !org.bookingEnabled) throw new UserError("La réservation en ligne n'est pas disponible.");
    try {
      const appt = await createAppointment({
        org,
        serviceId: data.serviceId,
        staffId: data.staffId,
        startsAt: new Date(data.startsAt),
        source: "online",
        customer: { firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone ?? null, emailOptIn: data.emailOptIn },
        customerNote: data.note ?? null,
        actor: { kind: "customer" },
        enforceSchedule: true,
      });
      dispatchSoon();
      return { token: createManageToken(appt.id) };
    } catch (error) {
      // Les limites de forfait concernent le professionnel : message neutre pour le client.
      if (error instanceof PlanLimitError) {
        throw new UserError("Cet établissement ne peut pas accepter de nouvelle réservation en ligne pour le moment. Contactez-le directement.");
      }
      throw error;
    }
  });
}
