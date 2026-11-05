import "server-only";
import { and, count, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { invitation, member, organization, service, workingHours } from "@/db/schema";
import type { OrgContext } from "@/server/auth/session";

export type SetupStep = { key: string; title: string; description: string; done: boolean; href: string; optional?: boolean };

/** Avancement de l'installation, calculé depuis les données réelles. */
export async function getSetupProgress(ctx: OrgContext) {
  const o = ctx.organization;
  const [[svc], [hours], [members], [invites]] = await Promise.all([
    db.select({ n: count() }).from(service).where(and(eq(service.organizationId, o.id), isNull(service.deletedAt))),
    db.select({ n: count() }).from(workingHours).where(and(eq(workingHours.organizationId, o.id), isNull(workingHours.staffId))),
    db.select({ n: count() }).from(member).where(and(eq(member.organizationId, o.id), ne(member.userId, ctx.userId))),
    db.select({ n: count() }).from(invitation).where(and(eq(invitation.organizationId, o.id), eq(invitation.status, "pending"))),
  ]);
  const steps: SetupStep[] = [
    { key: "info", title: "Informations de l'entreprise", description: "Logo, adresse et téléphone affichés à vos clients.", done: Boolean(o.logoFileId || o.phone || o.addressLine1), href: "/tableau-de-bord/parametres/entreprise" },
    { key: "hours", title: "Horaires d'ouverture", description: "Vos jours et heures d'ouverture, pauses comprises.", done: hours.n > 0 && Boolean(o.onboardingCompletedAt || o.metadata?.includes("hours")), href: "/tableau-de-bord/parametres/horaires" },
    { key: "services", title: "Vos prestations", description: "Durée, prix et employés qui les réalisent.", done: svc.n > 0, href: "/tableau-de-bord/services" },
    { key: "team", title: "Votre équipe", description: "Invitez vos collaborateurs (facultatif).", done: members.n + invites.n > 0, href: "/tableau-de-bord/equipe", optional: true },
    { key: "page", title: "Votre page de réservation", description: "Vérifiez les règles et partagez votre lien.", done: Boolean(o.onboardingCompletedAt), href: "/tableau-de-bord/parametres/reservation" },
  ];
  const required = steps.filter((s) => !s.optional);
  return {
    steps,
    total: steps.length,
    done: steps.filter((s) => s.done).length,
    remaining: required.filter((s) => !s.done).length,
  };
}

export async function markOnboardingStep(organizationId: string, step: "hours" | "done") {
  const [org] = await db.select({ metadata: organization.metadata }).from(organization).where(eq(organization.id, organizationId));
  const meta = new Set((org?.metadata ?? "").split(",").filter(Boolean));
  meta.add(step);
  await db
    .update(organization)
    .set({ metadata: [...meta].join(","), ...(step === "done" ? { onboardingCompletedAt: new Date() } : {}) })
    .where(eq(organization.id, organizationId));
}
