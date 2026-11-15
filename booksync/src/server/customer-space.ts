import "server-only";
import { and, asc, desc, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { appointment, customer, organization, staff } from "@/db/schema";
import { createManageToken } from "@/lib/manage-token";

function myAppointments(where: SQL, order: SQL, limit: number) {
  return db
    .select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      serviceName: appointment.serviceName,
      priceCents: appointment.priceCents,
      staffName: staff.displayName,
      orgName: organization.name,
      orgSlug: organization.slug,
      orgTimezone: organization.timezone,
      orgAddress: organization.addressLine1,
      orgPostalCode: organization.postalCode,
      orgCity: organization.city,
      orgPhone: organization.phone,
    })
    .from(appointment)
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .innerJoin(organization, eq(organization.id, appointment.organizationId))
    .innerJoin(staff, eq(staff.id, appointment.staffId))
    .where(where)
    .orderBy(order)
    .limit(limit);
}

/**
 * Espace particulier : les rendez-vous d'un utilisateur sont retrouvés, dans tous les
 * établissements, grâce à son adresse email — UNIQUEMENT si elle est vérifiée (preuve que
 * l'adresse lui appartient). Seules les informations utiles au client sont renvoyées
 * (jamais les notes internes de l'établissement).
 */
export async function listMyAppointments(user: { email: string; emailVerified: boolean }) {
  if (!user.emailVerified) return { upcoming: [], past: [] };
  const mine = sql`lower(${customer.email}) = ${user.email.toLowerCase()}`;
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    myAppointments(and(mine, gte(appointment.endsAt, now))!, asc(appointment.startsAt), 50),
    myAppointments(and(mine, lt(appointment.endsAt, now))!, desc(appointment.startsAt), 30),
  ]);
  const withLink = <T extends { id: string }>(r: T) => ({
    ...r,
    manageToken: createManageToken(r.id),
  });
  return { upcoming: upcoming.map(withLink), past: past.map(withLink) };
}

export type MyAppointment = Awaited<ReturnType<typeof listMyAppointments>>["upcoming"][number];
