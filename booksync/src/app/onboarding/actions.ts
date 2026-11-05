"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { organization } from "@/db/schema";
import { SLUG_ERROR_MESSAGES, validateSlug } from "@/domain/organization/slug";
import { isValidTimeZone } from "@/domain/organization/timezones";
import { authErrorMessage, GENERIC_ERROR } from "@/lib/auth-errors";
import { auth } from "@/server/auth/auth";
import { getSession } from "@/server/auth/session";

export type OnboardingState = {
  errors?: Partial<Record<"name" | "slug" | "timezone", string>>;
  formError?: string;
  values?: { name: string; slug: string; timezone: string };
};

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indiquez le nom de votre entreprise (2 caractères minimum).")
    .max(80, "Le nom ne peut pas dépasser 80 caractères."),
  slug: z.string().trim().toLowerCase(),
  timezone: z.string().refine(isValidTimeZone, "Fuseau horaire invalide."),
});

export async function createOrganizationAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const values = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
  };
  const parsed = schema.safeParse(values);
  const errors: OnboardingState["errors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<OnboardingState["errors"]>;
      errors[key] ??= issue.message;
    }
  }
  const slug = values.slug.trim().toLowerCase();
  const slugError = validateSlug(slug);
  if (slugError) errors.slug = SLUG_ERROR_MESSAGES[slugError];
  if (!parsed.success || slugError) return { errors, values };

  const [taken] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);
  if (taken) return { errors: { slug: SLUG_ERROR_MESSAGES.taken }, values };

  try {
    await auth.api.createOrganization({
      body: { name: parsed.data.name, slug, timezone: parsed.data.timezone },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      const code = (error.body as { code?: string } | undefined)?.code;
      if (code === "ORGANIZATION_ALREADY_EXISTS" || code === "SLUG_IS_TAKEN") {
        return { errors: { slug: SLUG_ERROR_MESSAGES.taken }, values };
      }
      return { formError: authErrorMessage({ code, status: error.statusCode }), values };
    }
    console.error("[onboarding] création d'entreprise impossible", error);
    return { formError: GENERIC_ERROR, values };
  }

  redirect("/tableau-de-bord");
}

/** Vérification en direct de la disponibilité d'une adresse (formulaire d'onboarding). */
export async function checkSlugAvailability(slug: string): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  const normalized = slug.trim().toLowerCase();
  const error = validateSlug(normalized);
  if (error) return SLUG_ERROR_MESSAGES[error];
  const [taken] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, normalized))
    .limit(1);
  return taken ? SLUG_ERROR_MESSAGES.taken : null;
}
