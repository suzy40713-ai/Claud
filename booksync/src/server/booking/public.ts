import "server-only";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { organization, service, staff, staffService } from "@/db/schema";
import { effectivePlan } from "@/domain/billing/plans";
import { RESERVED_SLUGS } from "@/domain/organization/slug";
import { fileUrl } from "@/lib/files";
import { getOrganizationHours } from "@/server/catalog/staff";

export async function getOrgBySlug(slug: string) {
  if (!slug || RESERVED_SLUGS.has(slug) || !/^[a-z0-9-]{3,48}$/.test(slug)) return null;
  const [org] = await db.select().from(organization).where(eq(organization.slug, slug)).limit(1);
  return org ?? null;
}

/** Données affichées sur la page publique : uniquement ce qui est destiné aux clients. */
export async function getPublicBookingPage(slug: string) {
  const org = await getOrgBySlug(slug);
  if (!org) return null;
  const plan = effectivePlan(org.plan, org.subscriptionStatus);

  const services = await db
    .select({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      imageFileId: service.imageFileId,
      color: service.color,
    })
    .from(service)
    .where(and(eq(service.organizationId, org.id), eq(service.isActive, true), eq(service.isOnlineBookable, true), isNull(service.deletedAt)))
    .orderBy(asc(service.position), asc(service.createdAt));

  const links = services.length
    ? await db
        .select({ serviceId: staffService.serviceId, staffId: staffService.staffId })
        .from(staffService)
        .innerJoin(staff, eq(staff.id, staffService.staffId))
        .where(
          and(
            eq(staffService.organizationId, org.id),
            inArray(staffService.serviceId, services.map((s) => s.id)),
            eq(staff.isActive, true),
            eq(staff.isBookable, true),
          ),
        )
    : [];
  const staffIds = [...new Set(links.map((l) => l.staffId))];
  const team = staffIds.length
    ? await db
        .select({ id: staff.id, displayName: staff.displayName, photoFileId: staff.photoFileId, color: staff.color, bio: staff.bio })
        .from(staff)
        .where(and(eq(staff.organizationId, org.id), inArray(staff.id, staffIds)))
        .orderBy(asc(staff.position), asc(staff.createdAt))
    : [];

  return {
    organization: {
      id: org.id,
      slug: org.slug,
      name: org.name,
      description: org.description,
      phone: org.phone,
      email: org.email,
      address: [org.addressLine1, org.addressLine2, [org.postalCode, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
      timezone: org.timezone,
      logoUrl: fileUrl(org.logoFileId),
      bookingEnabled: org.bookingEnabled,
      maxAdvanceDays: org.maxAdvanceDays,
      cancellationNoticeHours: org.cancellationNoticeHours,
      brandColor: plan.features.bookingPageCustomization ? org.brandColor : null,
      coverUrl: plan.features.bookingPageCustomization ? fileUrl(org.coverFileId) : null,
      welcomeMessage: plan.features.bookingPageCustomization ? org.welcomeMessage : null,
    },
    hours: await getOrganizationHours(org.id),
    services: services
      .map((s) => ({ ...s, imageUrl: fileUrl(s.imageFileId), staffIds: links.filter((l) => l.serviceId === s.id).map((l) => l.staffId) }))
      .filter((s) => s.staffIds.length > 0),
    staff: team.map((t) => ({ id: t.id, name: t.displayName, photoUrl: fileUrl(t.photoFileId), color: t.color, bio: t.bio })),
  };
}

export type PublicBookingPage = NonNullable<Awaited<ReturnType<typeof getPublicBookingPage>>>;
