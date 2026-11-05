import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { member, organization, staff, workingHours } from "@/db/schema";
import { ACTIVITIES } from "@/domain/activities";
import { SLUG_ERROR_MESSAGES, validateSlug } from "@/domain/organization/slug";
import { isValidTimeZone } from "@/domain/organization/timezones";
import { pgErrorCode, UserError } from "@/server/errors";

/** Horaires proposés par défaut : du lundi au vendredi, 9 h–12 h et 14 h–18 h ; samedi 9 h–12 h. */
export const DEFAULT_WEEK: Array<{ weekday: number; startMinute: number; endMinute: number }> = [
  ...[1, 2, 3, 4, 5].flatMap((weekday) => [
    { weekday, startMinute: 9 * 60, endMinute: 12 * 60 },
    { weekday, startMinute: 14 * 60, endMinute: 18 * 60 },
  ]),
  { weekday: 6, startMinute: 9 * 60, endMinute: 12 * 60 },
];

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indiquez le nom de votre entreprise (2 caractères minimum).")
    .max(80, "Le nom ne peut pas dépasser 80 caractères."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .superRefine((v, ctx) => {
      const err = validateSlug(v);
      if (err) ctx.addIssue({ code: "custom", message: SLUG_ERROR_MESSAGES[err] });
    }),
  activity: z.enum(ACTIVITIES.map((a) => a.value) as [string, ...string[]], {
    message: "Choisissez votre activité.",
  }),
  timezone: z.string().refine(isValidTimeZone, "Fuseau horaire invalide."),
});

export async function isSlugTaken(slug: string, exceptOrgId?: string) {
  const [row] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);
  return Boolean(row && row.id !== exceptOrgId);
}

/**
 * Crée une entreprise et son propriétaire, en une transaction :
 * entreprise + membre « owner » + profil de réservation + horaires par défaut.
 */
export async function createOrganization(
  user: { id: string; name: string },
  input: z.input<typeof createOrganizationSchema>,
) {
  const data = createOrganizationSchema.parse(input);
  if (await isSlugTaken(data.slug))
    throw new UserError(SLUG_ERROR_MESSAGES.taken, { slug: SLUG_ERROR_MESSAGES.taken });
  try {
    return await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organization)
        .values({
          name: data.name,
          slug: data.slug,
          activity: data.activity,
          timezone: data.timezone,
        })
        .returning();
      const [owner] = await tx
        .insert(member)
        .values({ organizationId: org.id, userId: user.id, role: "owner" })
        .returning();
      const [profile] = await tx
        .insert(staff)
        .values({ organizationId: org.id, memberId: owner.id, displayName: user.name })
        .returning();
      await tx
        .insert(workingHours)
        .values([
          ...DEFAULT_WEEK.map((h) => ({ ...h, organizationId: org.id, staffId: null })),
          ...DEFAULT_WEEK.map((h) => ({ ...h, organizationId: org.id, staffId: profile.id })),
        ]);
      return org;
    });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      throw new UserError(SLUG_ERROR_MESSAGES.taken, { slug: SLUG_ERROR_MESSAGES.taken });
    }
    throw error;
  }
}
