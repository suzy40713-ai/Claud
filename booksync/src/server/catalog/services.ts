import "server-only";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { appointment, service, staff, staffService } from "@/db/schema";
import { assertCan } from "@/domain/permissions";
import { hexColor, optionalText } from "@/domain/validation";
import type { OrgContext } from "@/server/auth/session";
import { NotFoundError, UserError } from "@/server/errors";
import { deleteFile, storeImage } from "@/server/files";

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(80, "80 caractères maximum."),
  description: optionalText(500, "La description"),
  durationMinutes: z.coerce
    .number({ message: "Durée invalide." })
    .int("Durée invalide.")
    .min(5, "5 minutes minimum.")
    .max(720, "12 heures maximum."),
  priceCents: z.coerce
    .number({ message: "Prix invalide." })
    .int()
    .min(0, "Le prix ne peut pas être négatif.")
    .max(10_000_000, "Prix trop élevé."),
  bufferAfterMinutes: z.coerce.number().int().min(0).max(240, "4 heures maximum.").default(0),
  color: hexColor.default("#3563E9"),
  isActive: z.boolean().default(true),
  isOnlineBookable: z.boolean().default(true),
  staffIds: z.array(z.uuid()).max(50).default([]),
});

export async function listServices(ctx: OrgContext) {
  const rows = await db
    .select()
    .from(service)
    .where(and(eq(service.organizationId, ctx.organization.id), isNull(service.deletedAt)))
    .orderBy(asc(service.position), asc(service.createdAt));
  const links = rows.length
    ? await db
        .select({ serviceId: staffService.serviceId, staffId: staffService.staffId })
        .from(staffService)
        .where(eq(staffService.organizationId, ctx.organization.id))
    : [];
  return rows.map((s) => ({
    ...s,
    staffIds: links.filter((l) => l.serviceId === s.id).map((l) => l.staffId),
  }));
}

async function assertStaffInOrg(organizationId: string, staffIds: string[]) {
  if (!staffIds.length) return;
  const found = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.organizationId, organizationId), inArray(staff.id, staffIds)));
  if (found.length !== new Set(staffIds).size) throw new UserError("Employé invalide.");
}

export async function createService(ctx: OrgContext, input: z.input<typeof serviceSchema>) {
  assertCan(ctx.role, "services.manage");
  const { staffIds, ...data } = serviceSchema.parse(input);
  await assertStaffInOrg(ctx.organization.id, staffIds);
  return db.transaction(async (tx) => {
    const [{ max }] = await tx
      .select({ max: sql<number>`coalesce(max(${service.position}), -1)` })
      .from(service)
      .where(eq(service.organizationId, ctx.organization.id));
    const [row] = await tx
      .insert(service)
      .values({ ...data, organizationId: ctx.organization.id, position: Number(max) + 1 })
      .returning();
    if (staffIds.length) {
      await tx.insert(staffService).values(
        staffIds.map((staffId) => ({
          organizationId: ctx.organization.id,
          staffId,
          serviceId: row.id,
        })),
      );
    }
    return row;
  });
}

async function getService(ctx: OrgContext, id: string) {
  const [row] = await db
    .select()
    .from(service)
    .where(
      and(
        eq(service.id, id),
        eq(service.organizationId, ctx.organization.id),
        isNull(service.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError("Service introuvable.");
  return row;
}

export async function updateService(
  ctx: OrgContext,
  id: string,
  input: z.input<typeof serviceSchema>,
) {
  assertCan(ctx.role, "services.manage");
  await getService(ctx, id);
  const { staffIds, ...data } = serviceSchema.parse(input);
  await assertStaffInOrg(ctx.organization.id, staffIds);
  await db.transaction(async (tx) => {
    await tx
      .update(service)
      .set(data)
      .where(and(eq(service.id, id), eq(service.organizationId, ctx.organization.id)));
    await tx
      .delete(staffService)
      .where(
        and(eq(staffService.serviceId, id), eq(staffService.organizationId, ctx.organization.id)),
      );
    if (staffIds.length) {
      await tx.insert(staffService).values(
        staffIds.map((staffId) => ({
          organizationId: ctx.organization.id,
          staffId,
          serviceId: id,
        })),
      );
    }
  });
}

/** Suppression : définitive si le service n'a jamais été réservé, sinon archivage (historique conservé). */
export async function deleteService(ctx: OrgContext, id: string) {
  assertCan(ctx.role, "services.manage");
  const row = await getService(ctx, id);
  const [used] = await db
    .select({ id: appointment.id })
    .from(appointment)
    .where(and(eq(appointment.serviceId, id), eq(appointment.organizationId, ctx.organization.id)))
    .limit(1);
  if (used) {
    await db
      .update(service)
      .set({ deletedAt: new Date(), isActive: false, isOnlineBookable: false })
      .where(eq(service.id, id));
    await db.delete(staffService).where(eq(staffService.serviceId, id));
  } else {
    await db
      .delete(service)
      .where(and(eq(service.id, id), eq(service.organizationId, ctx.organization.id)));
    await deleteFile(ctx.organization.id, row.imageFileId);
  }
}

export async function setServiceImage(ctx: OrgContext, id: string, upload: File | null) {
  assertCan(ctx.role, "services.manage");
  const row = await getService(ctx, id);
  const fileId = upload ? await storeImage(ctx.organization.id, "service_image", upload) : null;
  await db.update(service).set({ imageFileId: fileId }).where(eq(service.id, id));
  await deleteFile(ctx.organization.id, row.imageFileId);
}

export async function reorderServices(ctx: OrgContext, orderedIds: string[]) {
  assertCan(ctx.role, "services.manage");
  await db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(service)
        .set({ position: index })
        .where(and(eq(service.id, id), eq(service.organizationId, ctx.organization.id)));
    }
  });
}
