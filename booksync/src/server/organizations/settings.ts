import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { organization } from "@/db/schema";
import { ACTIVITIES } from "@/domain/activities";
import { SLUG_ERROR_MESSAGES, validateSlug } from "@/domain/organization/slug";
import { isValidTimeZone } from "@/domain/organization/timezones";
import { assertCan, ForbiddenError } from "@/domain/permissions";
import {
  hexColor,
  optionalEmail,
  optionalPhone,
  optionalText,
  postalCode,
} from "@/domain/validation";
import type { OrgContext } from "@/server/auth/session";
import { pgErrorCode, UserError } from "@/server/errors";
import { deleteFile, storeImage, type FileKind } from "@/server/files";
import { isSlugTaken } from "./service";

export const organizationInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(80, "80 caractères maximum."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .superRefine((v, ctx) => {
      const err = validateSlug(v);
      if (err) ctx.addIssue({ code: "custom", message: SLUG_ERROR_MESSAGES[err] });
    }),
  activity: z.enum(ACTIVITIES.map((a) => a.value) as [string, ...string[]], {
    message: "Choisissez une activité.",
  }),
  description: optionalText(600, "La présentation"),
  email: optionalEmail,
  phone: optionalPhone,
  addressLine1: optionalText(120, "L'adresse"),
  addressLine2: optionalText(120, "Le complément d'adresse"),
  postalCode,
  city: optionalText(80, "La ville"),
  country: z.string().trim().length(2, "Pays invalide.").toUpperCase().default("FR"),
  timezone: z.string().refine(isValidTimeZone, "Fuseau horaire invalide."),
});

export async function updateOrganizationInfo(
  ctx: OrgContext,
  input: z.input<typeof organizationInfoSchema>,
) {
  assertCan(ctx.role, "organization.update");
  const data = organizationInfoSchema.parse(input);
  if (data.slug !== ctx.organization.slug && (await isSlugTaken(data.slug, ctx.organization.id))) {
    throw new UserError(SLUG_ERROR_MESSAGES.taken, { slug: SLUG_ERROR_MESSAGES.taken });
  }
  try {
    await db.update(organization).set(data).where(eq(organization.id, ctx.organization.id));
  } catch (error) {
    if (pgErrorCode(error) === "23505")
      throw new UserError(SLUG_ERROR_MESSAGES.taken, { slug: SLUG_ERROR_MESSAGES.taken });
    throw error;
  }
}

export const bookingSettingsSchema = z.object({
  bookingEnabled: z.boolean(),
  minNoticeMinutes: z.coerce
    .number()
    .int()
    .min(0, "Valeur invalide.")
    .max(43200, "30 jours maximum."),
  maxAdvanceDays: z.coerce.number().int().min(1, "1 jour minimum.").max(730, "2 ans maximum."),
  slotIntervalMinutes: z.coerce
    .number()
    .int()
    .refine((v) => [5, 10, 15, 20, 30, 45, 60].includes(v), "Intervalle invalide."),
  cancellationNoticeHours: z.coerce.number().int().min(0).max(720, "30 jours maximum."),
});

export async function updateBookingSettings(
  ctx: OrgContext,
  input: z.input<typeof bookingSettingsSchema>,
) {
  assertCan(ctx.role, "organization.update");
  const data = bookingSettingsSchema.parse(input);
  await db.update(organization).set(data).where(eq(organization.id, ctx.organization.id));
}

export const brandingSchema = z.object({
  brandColor: hexColor.nullable(),
  welcomeMessage: optionalText(300, "Le message d'accueil"),
});

/** Personnalisation de la page de réservation : réservée au forfait Pro. */
export async function updateBranding(ctx: OrgContext, input: z.input<typeof brandingSchema>) {
  assertCan(ctx.role, "organization.update");
  if (!ctx.plan.features.bookingPageCustomization) {
    throw new ForbiddenError(
      "La personnalisation de la page de réservation est incluse dans le forfait Pro.",
    );
  }
  const data = brandingSchema.parse(input);
  await db.update(organization).set(data).where(eq(organization.id, ctx.organization.id));
}

const IMAGE_COLUMNS = { logo: "logoFileId", cover: "coverFileId" } as const;

export async function replaceOrganizationImage(
  ctx: OrgContext,
  kind: "logo" | "cover",
  upload: File | null,
) {
  assertCan(ctx.role, "organization.update");
  if (kind === "cover" && !ctx.plan.features.bookingPageCustomization) {
    throw new ForbiddenError("Le visuel de couverture est inclus dans le forfait Pro.");
  }
  const column = IMAGE_COLUMNS[kind];
  const previous = ctx.organization[column];
  const id = upload ? await storeImage(ctx.organization.id, kind as FileKind, upload) : null;
  await db
    .update(organization)
    .set({ [column]: id })
    .where(eq(organization.id, ctx.organization.id));
  await deleteFile(ctx.organization.id, previous);
  return id;
}
