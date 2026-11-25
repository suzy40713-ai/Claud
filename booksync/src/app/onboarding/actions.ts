"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { findIdea } from "@/domain/launch/ideas";
import { slugify, validateSlug } from "@/domain/organization/slug";
import { runAction, type ActionResult } from "@/server/errors";
import { ACTIVE_ORG_COOKIE, getSession } from "@/server/auth/session";
import { createOrganization, isSlugTaken } from "@/server/organizations/service";

export type OnboardingState = ActionResult<undefined> & {
  values?: { name: string; stage: string };
};

/** Identifiant interne unique (le projet n'a plus de page publique). */
async function uniqueSlug(name: string) {
  const base = (slugify(name) || "projet").slice(0, 40).replace(/-+$/, "");
  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 && base.length >= 3 ? base : `${base}-${randomBytes(3).toString("hex")}`;
    if (!validateSlug(candidate) && !(await isSlugTaken(candidate))) return candidate;
  }
  return `projet-${randomBytes(6).toString("hex")}`;
}

export async function createOrganizationAction(_prev: OnboardingState | null, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (!session.user.termsAcceptedAt) redirect("/accepter-conditions");
  const values = {
    name: String(formData.get("name") ?? ""),
    stage: formData.get("stage") === "produit" ? "produit" : "idee",
  };
  const idea = String(formData.get("idee") ?? "");
  const result = await runAction(async () =>
    createOrganization(session.user, {
      name: values.name,
      slug: await uniqueSlug(values.name),
      timezone: "Europe/Paris",
      activity: "autre",
      bookingModule: false,
    }),
  );
  if (!result.ok) return { ...result, values } satisfies OnboardingState;
  (await cookies()).set(ACTIVE_ORG_COOKIE, result.data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  if (values.stage === "produit") redirect("/tableau-de-bord/produits/nouveau?premier=1");
  redirect(
    (findIdea(idea)
      ? `/tableau-de-bord/trouver-une-idee?idee=${idea}`
      : "/tableau-de-bord/trouver-une-idee") as Route,
  );
}
