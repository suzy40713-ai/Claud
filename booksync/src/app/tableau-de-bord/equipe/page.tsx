import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { canInviteRole, canChangeRole, canRemoveMember, type Role } from "@/domain/permissions";
import { fileUrl } from "@/lib/files";
import { requirePermission } from "@/server/auth/session";
import { listTeam } from "@/server/team/service";
import { TeamView } from "./team-view";

export const metadata: Metadata = { title: "Employés" };

async function Team() {
  const ctx = await requirePermission("team.view");
  const team = await listTeam(ctx);
  const roles: Role[] = ["owner", "admin", "employee"];
  return (
    <TeamView
      members={team.members.map((m) => ({
        ...m,
        photoUrl: fileUrl(m.photoFileId),
        joinedAt: m.joinedAt.toISOString(),
        isSelf: m.userId === ctx.userId,
        canRemove: canRemoveMember(ctx.role, m.role, m.userId === ctx.userId),
        roleOptions: roles.filter((r) => r === m.role || canChangeRole(ctx.role, m.role, r)),
      }))}
      invitations={team.invitations.map((i) => ({
        ...i,
        expiresAt: i.expiresAt.toISOString(),
        canManage: canInviteRole(ctx.role, i.role),
      }))}
      seats={{ used: team.seats.used, limit: ctx.plan.limits.members, plan: ctx.plan.name }}
      inviteRoles={(["employee", "admin"] as const).filter((r) => canInviteRole(ctx.role, r))}
      canUpgrade={ctx.role === "owner"}
    />
  );
}

export default function TeamPage() {
  return (
    <>
      <PageHeader title="Employés" description="Invitez votre équipe et gérez les accès de chacun." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Team />
      </Suspense>
    </>
  );
}
