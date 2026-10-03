import { PlanEditor } from "@/components/admin/admin-controls";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPlans() {
  const { data: plans } = await createAdminClient().from("plans").select("*").order("sort_order");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Offres & limites d'utilisation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Les limites sont appliquées côté serveur à chaque action. Les changements sont immédiats.</p>
      </div>
      {(plans ?? []).map((p) => <PlanEditor key={p.id} plan={p} />)}
    </div>
  );
}
