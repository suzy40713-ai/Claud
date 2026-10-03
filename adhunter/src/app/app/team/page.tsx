import { PageHeader, UpgradeGate } from "@/components/app/ui-bits";
import { CancelInvitationButton, CreateTeamForm, InviteForm, RemoveMemberButton } from "@/components/settings/team-forms";
import { requireAccount } from "@/lib/account";
import { hasFeature } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Équipe" };

export default async function TeamPage() {
  const account = await requireAccount("/app/team");
  const admin = createAdminClient();
  // Membership lookup (a member of a Business owner's team can see it even on another plan).
  const { data: memberships } = await admin.from("team_members").select("team_id, role").eq("user_id", account.user.id);
  const teamId = memberships?.[0]?.team_id;

  if (!teamId && !hasFeature(account.plan.features, "teams")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Équipe" />
        <UpgradeGate feature="L'espace équipe" plan="Business" description="Invite jusqu'à 10 collaborateurs et partage des collections avec eux pour travailler ensemble sur vos clients." />
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Équipe" description="Crée ton espace d'équipe pour partager des collections avec tes collaborateurs." />
        <div className="surface p-6"><CreateTeamForm /></div>
      </div>
    );
  }

  const [{ data: team }, { data: members }, { data: invitations }] = await Promise.all([
    admin.from("teams").select("*").eq("id", teamId).single(),
    admin.from("team_members").select("user_id, role, created_at").eq("team_id", teamId),
    admin.from("team_invitations").select("*").eq("team_id", teamId).is("accepted_at", null),
  ]);
  const ids = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, email, full_name").in("id", ids) : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const isOwner = team?.owner_id === account.user.id;

  return (
    <div className="space-y-6">
      <PageHeader title={team?.name ?? "Équipe"} description="Les collections créées avec l'option « Partager avec une équipe » sont visibles et modifiables par tous les membres." />
      {isOwner && (
        <section className="surface space-y-3 p-6">
          <h2 className="font-medium">Inviter un membre</h2>
          <InviteForm teamId={teamId} />
          <p className="text-xs text-muted-foreground">Jusqu'à 10 membres. Les personnes sans compte rejoignent l'équipe automatiquement après leur inscription avec cet email.</p>
        </section>
      )}
      <section className="surface p-6">
        <h2 className="font-medium">Membres ({members?.length ?? 0})</h2>
        <ul className="mt-4 divide-y divide-border">
          {(members ?? []).map((m) => {
            const p = byId.get(m.user_id);
            return (
              <li key={m.user_id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm">{p?.full_name || p?.email} {m.role === "owner" && <span className="ml-1 text-xs text-violet-400">Propriétaire</span>}</p>
                  <p className="text-xs text-muted-foreground">{p?.email} · depuis le {formatDate(m.created_at)}</p>
                </div>
                {isOwner && m.user_id !== account.user.id && <RemoveMemberButton teamId={teamId} userId={m.user_id} label="Retirer" />}
                {!isOwner && m.user_id === account.user.id && <RemoveMemberButton teamId={teamId} userId={m.user_id} label="Quitter l'équipe" />}
              </li>
            );
          })}
        </ul>
        {isOwner && (invitations ?? []).length > 0 && (
          <>
            <h3 className="mt-6 text-sm font-medium">Invitations en attente</h3>
            <ul className="mt-2 divide-y divide-border">
              {(invitations ?? []).map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{i.email}</span>
                  <CancelInvitationButton id={i.id} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
