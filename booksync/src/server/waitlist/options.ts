import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { service, staff } from "@/db/schema";
import type { OrgContext } from "@/server/auth/session";

/** Prestations et employés actifs, pour les formulaires du tableau de bord. */
export async function listBookableOptions(ctx: OrgContext) {
  const orgId = ctx.organization.id;
  const [services, team] = await Promise.all([
    db
      .select({ id: service.id, name: service.name })
      .from(service)
      .where(
        and(
          eq(service.organizationId, orgId),
          eq(service.isActive, true),
          isNull(service.deletedAt),
        ),
      )
      .orderBy(asc(service.position), asc(service.createdAt)),
    db
      .select({ id: staff.id, name: staff.displayName })
      .from(staff)
      .where(and(eq(staff.organizationId, orgId), eq(staff.isActive, true)))
      .orderBy(asc(staff.position), asc(staff.createdAt)),
  ]);
  return { services, staff: team };
}
