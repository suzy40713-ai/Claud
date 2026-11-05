import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { member, organization, staff } from "@/db/schema";
import { effectivePlan, type Plan } from "@/domain/billing/plans";
import { can, ForbiddenError, type Permission, type Role } from "@/domain/permissions";
import { auth } from "./auth";

export const ACTIVE_ORG_COOKIE = "booksync-org";

/** Session courante (ou null), mémorisée pour la durée de la requête. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Utilisateur connecté, sinon redirection vers la connexion. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  return session;
}

export type Membership = {
  organizationId: string;
  organizationName: string;
  slug: string;
  role: Role;
  memberId: string;
};

export async function listMemberships(userId: string): Promise<Membership[]> {
  const rows = await db
    .select({
      organizationId: organization.id,
      organizationName: organization.name,
      slug: organization.slug,
      role: member.role,
      memberId: member.id,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, userId))
    .orderBy(asc(member.createdAt));
  return rows;
}

export type OrgContext = {
  userId: string;
  user: { id: string; name: string; email: string; image: string | null };
  role: Role;
  memberId: string;
  staffId: string | null;
  organization: typeof organization.$inferSelect;
  plan: Plan;
  memberships: Membership[];
};

/**
 * Contexte d'entreprise de la requête : utilisateur, rôle, entreprise active, forfait effectif.
 * L'appartenance est TOUJOURS revérifiée en base. Toute opération métier part de ce contexte,
 * et toute requête filtre sur `ctx.organization.id` : c'est le garde-fou multi-tenant.
 */
export const requireOrg = cache(async (): Promise<OrgContext> => {
  const session = await requireSession();
  if (!session.user.termsAcceptedAt) redirect("/accepter-conditions");
  const memberships = await listMemberships(session.user.id);
  if (memberships.length === 0) redirect("/onboarding");
  const preferred = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const active = memberships.find((m) => m.organizationId === preferred) ?? memberships[0];
  return loadOrgContext(session.user, active, memberships);
});

export async function loadOrgContext(
  user: { id: string; name: string; email: string; image?: string | null },
  active: Membership,
  memberships: Membership[] = [active],
): Promise<OrgContext> {
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, active.organizationId))
    .limit(1);
  const [staffRow] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.memberId, active.memberId), eq(staff.organizationId, org.id)))
    .limit(1);
  return {
    userId: user.id,
    user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null },
    role: active.role,
    memberId: active.memberId,
    staffId: staffRow?.id ?? null,
    organization: org,
    plan: effectivePlan(org.plan, org.subscriptionStatus),
    memberships,
  };
}

/** Comme requireOrg, mais exige une permission (sinon page « accès refusé »). */
export async function requirePermission(permission: Permission) {
  const ctx = await requireOrg();
  if (!can(ctx.role, permission)) redirect("/tableau-de-bord?acces=refuse");
  return ctx;
}

export function assertPermission(ctx: Pick<OrgContext, "role">, permission: Permission) {
  if (!can(ctx.role, permission)) throw new ForbiddenError();
}

/** Pour les pages publiques d'authentification : un utilisateur déjà connecté est redirigé. */
export async function redirectIfAuthenticated() {
  const session = await getSession();
  if (session) await redirectToHome(session.user.id, !session.user.termsAcceptedAt);
  return null;
}

export async function redirectToHome(userId: string, needsTerms = false): Promise<never> {
  if (needsTerms) redirect("/accepter-conditions");
  const memberships = await listMemberships(userId);
  redirect(memberships.length > 0 ? "/tableau-de-bord" : "/onboarding");
}
