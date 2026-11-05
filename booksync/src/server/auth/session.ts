import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { member, organization } from "@/db/schema";
import { auth } from "./auth";

/** Session courante (ou null). Lit les cookies : à appeler dans un composant sous <Suspense>. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Utilisateur connecté et vérifié, sinon redirection vers la connexion. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  return session;
}

export type ActiveOrganization = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  role: string;
};

/** Entreprises dont l'utilisateur est membre, la plus ancienne en premier (source de vérité : la base). */
export async function listMemberships(userId: string): Promise<ActiveOrganization[]> {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      timezone: organization.timezone,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, userId))
    .orderBy(asc(member.createdAt));
}

/**
 * Entreprise active de l'utilisateur, avec son rôle.
 * L'appartenance est toujours vérifiée en base (le cookie de session peut être en cache) :
 * c'est le garde-fou multi-tenant. Toute requête métier doit partir de cet objet.
 */
export async function requireOrganization() {
  const session = await requireSession();
  const memberships = await listMemberships(session.user.id);
  if (memberships.length === 0) redirect("/onboarding");
  const active =
    memberships.find((m) => m.id === session.session.activeOrganizationId) ?? memberships[0];
  return { session, organization: active };
}

/** Pour les pages publiques d'authentification : un utilisateur déjà connecté est redirigé. */
export async function redirectIfAuthenticated() {
  const session = await getSession();
  if (session) await redirectToHome(session.user.id);
  return null;
}

/** Tableau de bord si l'utilisateur a une entreprise, sinon création de l'entreprise. */
export async function redirectToHome(userId: string): Promise<never> {
  const memberships = await listMemberships(userId);
  redirect(memberships.length > 0 ? "/tableau-de-bord" : "/onboarding");
}
