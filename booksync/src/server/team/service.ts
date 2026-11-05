import "server-only";
import { and, asc, count, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { invitation, member, organization, staff, user, workingHours } from "@/db/schema";
import { hasRoom, LIMIT_MESSAGES, PlanLimitError } from "@/domain/billing/plans";
import {
  canChangeRole,
  canInviteRole,
  canRemoveMember,
  ForbiddenError,
  isRole,
  type Role,
} from "@/domain/permissions";
import { env } from "@/lib/env";
import { generateToken, hashToken } from "@/lib/tokens";
import type { OrgContext } from "@/server/auth/session";
import { sendEmail } from "@/server/email/send";
import { invitationTemplate } from "@/server/email/templates";
import { NotFoundError, pgErrorCode, UserError } from "@/server/errors";

export const INVITATION_TTL_DAYS = 7;

export async function countSeats(organizationId: string) {
  const [members] = await db.select({ n: count() }).from(member).where(eq(member.organizationId, organizationId));
  const [pending] = await db
    .select({ n: count() })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, organizationId),
        eq(invitation.status, "pending"),
        gt(invitation.expiresAt, new Date()),
      ),
    );
  return { members: members.n, pending: pending.n, used: members.n + pending.n };
}

export async function listTeam(ctx: OrgContext) {
  const members = await db
    .select({
      memberId: member.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: member.role,
      joinedAt: member.createdAt,
      staffId: staff.id,
      displayName: staff.displayName,
      photoFileId: staff.photoFileId,
      color: staff.color,
      isBookable: staff.isBookable,
      isActive: staff.isActive,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .leftJoin(staff, eq(staff.memberId, member.id))
    .where(eq(member.organizationId, ctx.organization.id))
    .orderBy(sql`case ${member.role} when 'owner' then 0 when 'admin' then 1 else 2 end`, asc(member.createdAt));

  const invitations = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    })
    .from(invitation)
    .where(and(eq(invitation.organizationId, ctx.organization.id), eq(invitation.status, "pending")))
    .orderBy(asc(invitation.createdAt));

  return { members, invitations, seats: await countSeats(ctx.organization.id) };
}

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Adresse email invalide.")),
  role: z.enum(["admin", "employee"], { message: "Rôle invalide." }),
});

function invitationUrl(token: string) {
  return `${env.NEXT_PUBLIC_APP_URL}/invitation/${token}`;
}

async function sendInvitationEmail(ctx: OrgContext, email: string, role: Role, token: string) {
  return sendEmail(
    email,
    invitationTemplate({
      organizationName: ctx.organization.name,
      inviterName: ctx.user.name,
      role,
      url: invitationUrl(token),
      expiresInDays: INVITATION_TTL_DAYS,
    }),
  );
}

export async function inviteMember(ctx: OrgContext, input: z.input<typeof inviteSchema>) {
  const data = inviteSchema.parse(input);
  if (!canInviteRole(ctx.role, data.role)) throw new ForbiddenError();

  const [existing] = await db
    .select({ id: member.id })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, ctx.organization.id), sql`lower(${user.email}) = ${data.email}`))
    .limit(1);
  if (existing) throw new UserError("Cette personne fait déjà partie de votre équipe.", { email: "Déjà membre de l'équipe." });

  const token = generateToken();
  const row = await db.transaction(async (tx) => {
    // Verrou sur l'entreprise : deux invitations simultanées ne peuvent pas dépasser la limite.
    await tx.execute(sql`select id from organization where id = ${ctx.organization.id} for update`);
    // Une invitation expirée ou en attente pour la même adresse est remplacée.
    await tx
      .update(invitation)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(invitation.organizationId, ctx.organization.id),
          eq(invitation.status, "pending"),
          sql`lower(${invitation.email}) = ${data.email}`,
        ),
      );
    const [m] = await tx.select({ n: count() }).from(member).where(eq(member.organizationId, ctx.organization.id));
    const [p] = await tx
      .select({ n: count() })
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, ctx.organization.id),
          eq(invitation.status, "pending"),
          gt(invitation.expiresAt, new Date()),
        ),
      );
    if (!hasRoom(ctx.plan.limits.members, m.n + p.n)) {
      throw new PlanLimitError("members", LIMIT_MESSAGES.members(ctx.plan));
    }
    const [inv] = await tx
      .insert(invitation)
      .values({
        organizationId: ctx.organization.id,
        email: data.email,
        role: data.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000),
        inviterId: ctx.userId,
      })
      .returning();
    return inv;
  });
  await sendInvitationEmail(ctx, data.email, data.role, token);
  return row;
}

async function getPendingInvitation(ctx: OrgContext, invitationId: string) {
  const [inv] = await db
    .select()
    .from(invitation)
    .where(
      and(
        eq(invitation.id, invitationId),
        eq(invitation.organizationId, ctx.organization.id),
        eq(invitation.status, "pending"),
      ),
    )
    .limit(1);
  if (!inv) throw new NotFoundError("Invitation introuvable.");
  if (!canInviteRole(ctx.role, inv.role)) throw new ForbiddenError();
  return inv;
}

/** Renvoie l'invitation avec un NOUVEAU lien (l'ancien devient invalide) et prolonge sa validité. */
export async function resendInvitation(ctx: OrgContext, invitationId: string) {
  const inv = await getPendingInvitation(ctx, invitationId);
  const token = generateToken();
  await db
    .update(invitation)
    .set({ tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000) })
    .where(eq(invitation.id, inv.id));
  await sendInvitationEmail(ctx, inv.email, inv.role, token);
}

export async function cancelInvitation(ctx: OrgContext, invitationId: string) {
  const inv = await getPendingInvitation(ctx, invitationId);
  await db.update(invitation).set({ status: "cancelled" }).where(eq(invitation.id, inv.id));
}

async function getMember(ctx: OrgContext, memberId: string) {
  const [m] = await db
    .select()
    .from(member)
    .where(and(eq(member.id, memberId), eq(member.organizationId, ctx.organization.id)))
    .limit(1);
  if (!m) throw new NotFoundError("Membre introuvable.");
  return m;
}

export async function changeMemberRole(ctx: OrgContext, memberId: string, role: string) {
  if (!isRole(role)) throw new UserError("Rôle invalide.");
  const m = await getMember(ctx, memberId);
  if (!canChangeRole(ctx.role, m.role, role)) throw new ForbiddenError();
  await db.update(member).set({ role }).where(eq(member.id, m.id));
}

export async function removeMember(ctx: OrgContext, memberId: string) {
  const m = await getMember(ctx, memberId);
  if (!canRemoveMember(ctx.role, m.role, m.userId === ctx.userId)) throw new ForbiddenError();
  // Le profil de réservation est conservé (désactivé) pour garder l'historique des rendez-vous ;
  // on refuse le retrait tant que des rendez-vous à venir lui sont attribués.
  const [upcoming] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from appointment a
    join staff s on s.id = a.staff_id
    where s.member_id = ${m.id} and a.status = 'confirmed' and a.starts_at > now()`);
  if ((upcoming?.n ?? 0) > 0) {
    throw new UserError(
      `Ce membre a ${upcoming.n} rendez-vous à venir. Réattribuez-les ou annulez-les avant de le retirer de l'équipe.`,
    );
  }
  await db.transaction(async (tx) => {
    await tx.update(staff).set({ isActive: false, isBookable: false }).where(eq(staff.memberId, m.id));
    await tx.delete(member).where(eq(member.id, m.id));
  });
}

/* ─────────────────────────────── Acceptation ─────────────────────────────── */

export type InvitationView = {
  id: string;
  email: string;
  role: Role;
  organizationName: string;
  inviterName: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
};

export async function getInvitationByToken(token: string): Promise<InvitationView | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const [row] = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationName: organization.name,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(organization.id, invitation.organizationId))
    .innerJoin(user, eq(user.id, invitation.inviterId))
    .where(eq(invitation.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return null;
  const status = row.status === "pending" && row.expiresAt < new Date() ? "expired" : row.status;
  return { ...row, status };
}

/**
 * Accepte une invitation : le compte connecté doit correspondre à l'adresse invitée.
 * Crée le membre et son profil de réservation (horaires de l'entreprise par défaut).
 */
export async function acceptInvitation(token: string, current: { id: string; email: string; name: string }) {
  const view = await getInvitationByToken(token);
  if (!view) throw new UserError("Ce lien d'invitation n'est pas valide.");
  if (view.status === "expired") throw new UserError("Cette invitation a expiré. Demandez-en une nouvelle.");
  if (view.status !== "pending") throw new UserError("Cette invitation n'est plus valable.");
  if (view.email.toLowerCase() !== current.email.toLowerCase()) {
    throw new UserError(`Cette invitation est destinée à ${view.email}. Connectez-vous avec cette adresse.`);
  }

  return db.transaction(async (tx) => {
    const [inv] = await tx
      .update(invitation)
      .set({ status: "accepted" })
      .where(and(eq(invitation.id, view.id), eq(invitation.status, "pending")))
      .returning();
    if (!inv) throw new UserError("Cette invitation n'est plus valable.");
    try {
      const [m] = await tx
        .insert(member)
        .values({ organizationId: inv.organizationId, userId: current.id, role: inv.role })
        .returning();
      const [profile] = await tx
        .insert(staff)
        .values({ organizationId: inv.organizationId, memberId: m.id, displayName: current.name })
        .returning();
      const orgHours = await tx
        .select()
        .from(workingHours)
        .where(and(eq(workingHours.organizationId, inv.organizationId), sql`${workingHours.staffId} is null`));
      if (orgHours.length) {
        await tx.insert(workingHours).values(
          orgHours.map((h) => ({
            organizationId: inv.organizationId,
            staffId: profile.id,
            weekday: h.weekday,
            startMinute: h.startMinute,
            endMinute: h.endMinute,
          })),
        );
      }
      return { organizationId: inv.organizationId };
    } catch (error) {
      if (pgErrorCode(error) === "23505") throw new UserError("Vous faites déjà partie de cette équipe.");
      throw error;
    }
  });
}

export async function declineInvitation(token: string) {
  const view = await getInvitationByToken(token);
  if (!view || view.status !== "pending") throw new UserError("Cette invitation n'est plus valable.");
  await db.update(invitation).set({ status: "declined" }).where(eq(invitation.id, view.id));
}
