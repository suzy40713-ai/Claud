import Link from "next/link";

import { ManualPlanForm, RoleSelect } from "@/components/admin/admin-controls";
import { effectivePlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE = 50;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const p = Math.max(1, Number(page) || 1);
  const admin = createAdminClient();
  let query = admin.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((p - 1) * PAGE, p * PAGE - 1);
  if (q) query = query.ilike("email", `%${q.replace(/[%_]/g, "")}%`);
  const { data: users, count } = await query;
  const ids = (users ?? []).map((u) => u.id);
  const { data: subs } = ids.length ? await admin.from("subscriptions").select("*").in("user_id", ids) : { data: [] };
  const subById = new Map((subs ?? []).map((s) => [s.user_id, s]));
  const pages = Math.ceil((count ?? 0) / PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Utilisateurs <span className="text-base font-normal text-muted-foreground">({count ?? 0})</span></h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Rechercher par email…" className="h-9 w-64 rounded-lg border border-input bg-background px-3 text-sm" aria-label="Rechercher par email" />
        </form>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-card text-left text-xs text-muted-foreground">
            <tr><th className="p-3 font-medium">Email</th><th className="p-3 font-medium">Inscription</th><th className="p-3 font-medium">Formule</th><th className="p-3 font-medium">Statut</th><th className="p-3 font-medium">Rôle</th><th className="p-3 font-medium">Attribuer une formule</th></tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => {
              const s = subById.get(u.id);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3"><p>{u.email}</p><p className="text-xs text-muted-foreground">{u.full_name}</p></td>
                  <td className="p-3 text-xs">{formatDate(u.created_at)}</td>
                  <td className="p-3">{effectivePlan(s)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{s ? `${s.status} (${s.source})` : "—"}</td>
                  <td className="p-3"><RoleSelect userId={u.id} role={u.role} /></td>
                  <td className="p-3"><ManualPlanForm userId={u.id} plan={s?.plan ?? "free"} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {p > 1 && <Link href={`/admin/users?page=${p - 1}${q ? `&q=${q}` : ""}`} className="text-violet-400">← Précédent</Link>}
          <span className="text-muted-foreground">Page {p} / {pages}</span>
          {p < pages && <Link href={`/admin/users?page=${p + 1}${q ? `&q=${q}` : ""}`} className="text-violet-400">Suivant →</Link>}
        </div>
      )}
    </div>
  );
}
