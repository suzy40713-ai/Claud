import { FlagSwitch } from "@/components/admin/admin-controls";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminFeatures() {
  const { data: flags } = await createAdminClient().from("feature_flags").select("*").order("key");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fonctionnalités</h1>
        <p className="mt-1 text-sm text-muted-foreground">Interrupteurs globaux : désactive une source ou un outil en cas d'incident ou pour maîtriser les coûts.</p>
      </div>
      <ul className="surface divide-y divide-border">
        {(flags ?? []).map((f) => (
          <li key={f.key} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium">{f.description ?? f.key}</p>
              <p className="font-mono text-xs text-muted-foreground">{f.key}</p>
            </div>
            <FlagSwitch flagKey={f.key} enabled={f.enabled} />
          </li>
        ))}
      </ul>
    </div>
  );
}
