import "server-only";
import { getRatingSummaries } from "@/server/reviews";
import { and, asc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { organization, service, staff, staffService } from "@/db/schema";
import { activityLabel, HEALTH_ACTIVITIES } from "@/domain/activities";
import { addDays, localDateOf } from "@/domain/availability/engine";
import { fileUrl } from "@/lib/files";
import { getAvailability, type OrgRow } from "@/server/booking/availability";

/**
 * Annuaire public « Trouver un professionnel ».
 * Seuls apparaissent les établissements qui l'ont choisi (`listed`), dont la réservation en ligne
 * est ouverte, qui proposent au moins une prestation réservable, et dont l'activité n'est pas une
 * activité de santé. Seules des informations publiques sont renvoyées : jamais de rendez-vous,
 * de clients ni de données internes.
 */

export const PAGE_SIZE = 20;

export const directorySearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  metier: z.string().trim().max(40).optional().catch(undefined),
  lieu: z.string().trim().max(60).optional().catch(undefined),
  prixMax: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
  dispo: z.enum(["aujourdhui", "semaine"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(50).catch(1).default(1),
});

export type DirectorySearch = z.infer<typeof directorySearchSchema>;

const like = (v: string) => `%${v.replace(/[%_\\]/g, "\\$&")}%`;

/** Prestations réservables en ligne avec au moins un employé actif et réservable. */
const bookableService = and(
  eq(service.isActive, true),
  eq(service.isOnlineBookable, true),
  isNull(service.deletedAt),
  sql`exists (select 1 from ${staffService} ss join ${staff} st on st.id = ss.staff_id
       where ss.service_id = ${service.id} and st.is_active and st.is_bookable)`,
);

export function publicDirectoryFilter(): SQL {
  return and(
    eq(organization.listed, true),
    eq(organization.bookingEnabled, true),
    sql`${organization.activity} is not null`,
    sql`${organization.activity} not in (${sql.join(
      [...HEALTH_ACTIVITIES].map((a) => sql`${a}`),
      sql`, `,
    )})`,
    sql`exists (select 1 from ${service} where ${service.organizationId} = ${organization.id} and ${bookableService})`,
  )!;
}

/** Prochain créneau libre (prestation réservable la plus courte), dans `days` jours au plus. */
async function nextAvailability(org: OrgRow, days: number) {
  const [svc] = await db
    .select()
    .from(service)
    .where(and(eq(service.organizationId, org.id), bookableService))
    .orderBy(asc(service.durationMinutes))
    .limit(1);
  if (!svc) return null;
  const staffIds = (
    await db
      .select({ id: staff.id })
      .from(staffService)
      .innerJoin(staff, eq(staff.id, staffService.staffId))
      .where(
        and(
          eq(staffService.serviceId, svc.id),
          eq(staff.isActive, true),
          eq(staff.isBookable, true),
        ),
      )
  ).map((s) => s.id);
  if (!staffIds.length) return null;
  const today = localDateOf(new Date(), org.timezone);
  const result = await getAvailability(org, svc, staffIds, today, addDays(today, days - 1));
  for (const d of result) if (d.slots.length) return d.slots[0].start;
  return null;
}

export async function searchDirectory(input: DirectorySearch) {
  const conds: SQL[] = [publicDirectoryFilter()];
  if (input.metier) conds.push(eq(organization.activity, input.metier));
  if (input.lieu) {
    const place = input.lieu;
    conds.push(
      /^\d{2,5}$/.test(place)
        ? sql`${organization.postalCode} like ${`${place}%`}`
        : ilike(organization.city, like(place)),
    );
  }
  if (input.q) {
    const q = like(input.q);
    conds.push(
      or(
        ilike(organization.name, q),
        ilike(organization.description, q),
        sql`exists (select 1 from ${service} where ${service.organizationId} = ${organization.id} and ${bookableService} and ${service.name} ilike ${q})`,
      )!,
    );
  }
  const minPrice = sql<number>`(select min(${service.priceCents}) from ${service} where ${service.organizationId} = ${organization.id} and ${bookableService})`;
  if (input.prixMax) conds.push(sql`${minPrice} <= ${input.prixMax * 100}`);

  // Filtre de disponibilité : calculé avec le vrai moteur de créneaux sur un nombre borné de candidats.
  const candidateLimit = input.dispo ? 60 : PAGE_SIZE + 1;
  const offset = input.dispo ? 0 : (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select({ org: organization, minPriceCents: minPrice })
    .from(organization)
    .where(and(...conds))
    .orderBy(asc(organization.name))
    .limit(candidateLimit)
    .offset(offset);

  const withSlots = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      nextSlot: await nextAvailability(r.org, input.dispo === "aujourdhui" ? 1 : 7),
    })),
  );
  let list = withSlots;
  let hasMore = false;
  if (input.dispo) {
    list = withSlots.filter((r) => r.nextSlot);
    hasMore = false;
    list = list.slice((input.page - 1) * PAGE_SIZE, input.page * PAGE_SIZE);
  } else {
    hasMore = withSlots.length > PAGE_SIZE;
    list = withSlots.slice(0, PAGE_SIZE);
  }

  const ids = list.map((r) => r.org.id);
  const services = ids.length
    ? await db
        .select({
          organizationId: service.organizationId,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
        })
        .from(service)
        .where(and(inArray(service.organizationId, ids), bookableService))
        .orderBy(asc(service.position), asc(service.createdAt))
    : [];

  const ratings = await getRatingSummaries(ids);

  return {
    hasMore,
    results: list.map(({ org, minPriceCents, nextSlot }) => ({
      slug: org.slug,
      name: org.name,
      activity: activityLabel(org.activity),
      description: org.description,
      city: org.city,
      postalCode: org.postalCode,
      address: org.addressLine1,
      timezone: org.timezone,
      logoUrl: fileUrl(org.logoFileId),
      minPriceCents: minPriceCents === null ? null : Number(minPriceCents),
      services: services.filter((s) => s.organizationId === org.id).slice(0, 3),
      servicesCount: services.filter((s) => s.organizationId === org.id).length,
      nextSlot,
      rating: ratings.get(org.id) ?? null,
    })),
  };
}

export type DirectoryResult = Awaited<ReturnType<typeof searchDirectory>>["results"][number];
