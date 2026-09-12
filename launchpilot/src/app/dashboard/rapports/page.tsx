import Link from "next/link";
import { FileBarChart } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listReports } from "@/lib/data/reports";
import { formatDate } from "@/lib/utils";

export default async function ReportsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const reports = await listReports(supabase, user.id);

  return (
    <div>
      <PageHeader title="Rapports" description="L'historique de tous les plans marketing générés." />

      {reports.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="Aucun rapport pour le moment"
          description="Génère ton premier plan marketing pour voir apparaître ton rapport ici."
          actionLabel="Créer mon plan"
          actionHref="/onboarding"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <Link key={r.id} href={`/dashboard/rapports/${r.id}`}>
              <Card className="card-hover h-full">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{r.productName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                    </div>
                    <Badge variant={r.score >= 70 ? "success" : r.score >= 45 ? "warning" : "destructive"}>
                      {r.score}/100
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
