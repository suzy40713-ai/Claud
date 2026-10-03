import Link from "next/link";

import { PurgeErrorsButton, ResolveErrorButton } from "@/components/admin/admin-controls";
import { createAdminClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminErrors({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  let q = createAdminClient().from("app_errors").select("*").order("created_at", { ascending: false }).limit(200);
  if (!all) q = q.eq("resolved", false);
  const { data: errors } = await q;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Erreurs techniques</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={all ? "/admin/errors" : "/admin/errors?all=1"} className="text-violet-400">{all ? "Non résolues uniquement" : "Tout afficher"}</Link>
          <PurgeErrorsButton />
        </div>
      </div>
      {(errors ?? []).length === 0 ? (
        <p className="surface p-6 text-sm text-muted-foreground">Aucune erreur à traiter. 🎉</p>
      ) : (
        <ul className="space-y-2">
          {(errors ?? []).map((e) => (
            <li key={e.id} className="surface flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-xs text-violet-400">{e.context} · {formatRelative(e.created_at)}{e.user_id && ` · user ${e.user_id.slice(0, 8)}`}</p>
                <p className="mt-1 break-words text-sm">{e.message}</p>
                {e.details != null && <pre className="mt-2 max-h-32 overflow-auto rounded bg-background p-2 text-[11px] text-muted-foreground">{JSON.stringify(e.details, null, 2)}</pre>}
              </div>
              <ResolveErrorButton id={e.id} resolved={e.resolved} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
