"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SLUG_ERROR_MESSAGES, validateSlug } from "@/domain/organization/slug";
import { runAction, type ActionResult } from "@/server/errors";
import { ACTIVE_ORG_COOKIE, getSession } from "@/server/auth/session";
import { createOrganization, isSlugTaken } from "@/server/organizations/service";

export type OnboardingState = ActionResult<undefined> & {
  values?: { name: string; slug: string; timezone: string; activity: string; booking: string };
};

export async function createOrganizationAction(_prev: OnboardingState | null, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (!session.user.termsAcceptedAt) redirect("/accepter-conditions");
  const values = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    activity: String(formData.get("activity") ?? ""),
    booking: formData.get("booking") === "0" ? "0" : "1",
  };
  const result = await runAction(() =>
    createOrganization(session.user, { ...values, bookingModule: values.booking === "1" }),
  );
  if (!result.ok) return { ...result, values } satisfies OnboardingState;
  (await cookies()).set(ACTIVE_ORG_COOKIE, result.data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  // Vente de services sur rendez-vous : installation de l'agenda ; sinon, premier produit.
  redirect(
    values.booking === "1"
      ? "/tableau-de-bord/demarrage"
      : "/tableau-de-bord/produits/nouveau?premier=1",
  );
}

/** Vérification en direct de la disponibilité d'une adresse. */
export async function checkSlugAvailability(slug: string): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  const normalized = slug.trim().toLowerCase();
  const error = validateSlug(normalized);
  if (error) return SLUG_ERROR_MESSAGES[error];
  return (await isSlugTaken(normalized)) ? SLUG_ERROR_MESSAGES.taken : null;
}
