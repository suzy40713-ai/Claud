import "server-only";

import type { Account } from "@/lib/account";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

/** Turns pending invitations for the signed-in email into memberships. */
export async function claimPendingInvitations(account: Account) {
  if (!integrations.supabaseAdmin() || !account.user.email) return;
  const admin = createAdminClient();
  const { data: invites } = await admin
    .from("team_invitations")
    .select("id, team_id")
    .eq("email", account.user.email.toLowerCase())
    .is("accepted_at", null);
  for (const inv of invites ?? []) {
    await admin
      .from("team_members")
      .upsert({ team_id: inv.team_id, user_id: account.user.id, role: "member" }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
    await admin.from("team_invitations").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id);
  }
}
