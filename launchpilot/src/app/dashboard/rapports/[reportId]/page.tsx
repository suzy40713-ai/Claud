import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ScoreGauge } from "@/components/reports/score-gauge";
import { SubscoreCard } from "@/components/reports/subscore-card";
import { PersonaCard } from "@/components/reports/persona-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getReportBundle } from "@/lib/data/reports";
import { formatDate } from "@/lib/utils";

export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { report, persona } = await getReportBundle(supabase, reportId, user.id);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={report.product?.name || "Rapport marketing"}
        description={`Généré le ${formatDate(report.created_at)}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/strategie">
              Voir positionnement & offre
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
          <ScoreGauge score={report.score} />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Marketing Readiness Score
            </p>
            <p className="text-lg font-medium">{report.summary}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Analyse détaillée</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {report.subscore_details.map((s) => (
            <SubscoreCard key={s.axis} subscore={s} />
          ))}
        </div>
      </div>

      {persona ? (
        <PersonaCard persona={persona} />
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Le persona n'a pas pu être généré pour ce rapport.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
