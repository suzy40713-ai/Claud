import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  automationRule,
  autopilotAction,
  waitlistEntry,
  waitlistOffer,
  account,
  appointment,
  customer,
  member,
  organization,
  service,
  staff,
  timeOff,
  user,
  workingHours,
} from "@/db/schema";
import { UserError } from "@/server/errors";

/**
 * Export RGPD (droit d'accès et de portabilité) au format JSON.
 * Inclut le profil, les appartenances et, pour les entreprises dont l'utilisateur est propriétaire,
 * l'ensemble des données de l'entreprise.
 */
export async function exportUserData(userId: string) {
  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      termsAcceptedAt: user.termsAcceptedAt,
      termsVersion: user.termsVersion,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId));
  const providers = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, userId));
  const memberships = await db
    .select({
      organizationId: member.organizationId,
      role: member.role,
      joinedAt: member.createdAt,
    })
    .from(member)
    .where(eq(member.userId, userId));

  const ownedIds = memberships.filter((m) => m.role === "owner").map((m) => m.organizationId);
  const organizations = [];
  for (const orgId of ownedIds) {
    const [org] = await db.select().from(organization).where(eq(organization.id, orgId));
    organizations.push({
      organization: { ...org, stripeCustomerId: undefined, stripeSubscriptionId: undefined },
      services: await db.select().from(service).where(eq(service.organizationId, orgId)),
      staff: await db.select().from(staff).where(eq(staff.organizationId, orgId)),
      workingHours: await db
        .select()
        .from(workingHours)
        .where(eq(workingHours.organizationId, orgId)),
      timeOff: await db.select().from(timeOff).where(eq(timeOff.organizationId, orgId)),
      customers: await db.select().from(customer).where(eq(customer.organizationId, orgId)),
      appointments: (
        await db.select().from(appointment).where(eq(appointment.organizationId, orgId))
      ).map((a) => ({
        ...a,
        manageTokenHash: undefined,
      })),
      waitlist: await db
        .select()
        .from(waitlistEntry)
        .where(eq(waitlistEntry.organizationId, orgId)),
      waitlistOffers: await db
        .select()
        .from(waitlistOffer)
        .where(eq(waitlistOffer.organizationId, orgId)),
      automationRules: await db
        .select()
        .from(automationRule)
        .where(eq(automationRule.organizationId, orgId)),
      autopilotHistory: await db
        .select()
        .from(autopilotAction)
        .where(eq(autopilotAction.organizationId, orgId)),
    });
  }

  return {
    exportedAt: new Date().toISOString(),
    format: "BookSync — export des données personnelles (RGPD)",
    user: profile,
    loginMethods: providers.map((p) => (p.providerId === "credential" ? "email" : p.providerId)),
    memberships,
    organizations,
  };
}

export async function getAccountDeletionImpact(userId: string) {
  const owned = await db
    .select({
      id: organization.id,
      name: organization.name,
      subscriptionId: organization.stripeSubscriptionId,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(and(eq(member.userId, userId), eq(member.role, "owner")));
  return owned;
}

/**
 * Suppression définitive du compte (droit à l'effacement).
 * Les entreprises dont l'utilisateur est propriétaire sont supprimées avec toutes leurs données ;
 * leur abonnement Stripe est résilié immédiatement au préalable.
 */
export async function deleteAccount(
  userId: string,
  confirmation: string,
  cancelSubscription: (subscriptionId: string) => Promise<void>,
) {
  if (confirmation.trim().toUpperCase() !== "SUPPRIMER") {
    throw new UserError("Saisissez SUPPRIMER pour confirmer.", {
      confirmation: "Saisissez SUPPRIMER pour confirmer.",
    });
  }
  const owned = await getAccountDeletionImpact(userId);
  for (const org of owned) {
    if (org.subscriptionId) await cancelSubscription(org.subscriptionId);
  }
  await db.transaction(async (tx) => {
    if (owned.length) {
      await tx.delete(organization).where(
        inArray(
          organization.id,
          owned.map((o) => o.id),
        ),
      );
    }
    await tx.delete(user).where(eq(user.id, userId));
  });
}
