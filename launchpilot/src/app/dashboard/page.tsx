import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  FileBarChart,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, listReports } from "@/lib/data/reports";
import { formatDate } from "@/lib/utils";

const OBJECTIVE_LABELS: Record<string, string> = {
  first_customers: "Obtenir mes premiers clients",
  increase_sales: "Augmenter mes ventes",
  launch_product: "Lancer mon produit",
  grow_audience: "Développer mon audience",
  find_positioning: "Trouver mon positionnement",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const report = await getLatestReport(supabase, user.id);

  if (!report) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Ta vue d'ensemble sur ton lancement." />
        <EmptyState
          icon={Sparkles}
          title="Aucun plan généré pour le moment"
          description="Décris ton produit pour recevoir ton premier plan marketing personnalisé."
          actionLabel="Créer mon plan"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  const [{ count: contentCount }, { data: calendarDays }, { data: progress }, { data: todayActions }, reports] =
    await Promise.all([
      supabase
        .from("content_ideas")
        .select("*", { count: "exact", head: true })
        .eq("report_id", report.id),
      supabase.from("action_plans").select("id").eq("report_id", report.id),
      supabase.from("action_progress").select("action_plan_id, completed").eq("user_id", user.id),
      supabase
        .from("first_customer_actions")
        .select("*")
        .eq("report_id", report.id)
        .eq("timeframe", "today")
        .order("sort_order"),
      listReports(supabase, user.id),
    ]);

  const calendarIds = new Set((calendarDays ?? []).map((d) => d.id));
  const completedDays = (progress ?? []).filter((p) => p.completed && calendarIds.has(p.action_plan_id)).length;
  const totalDays = calendarDays?.length ?? 0;
  const calendarProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const product = report.product;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour 👋`}
        description={product ? `Voici où en est le lancement de ${product.name}.` : "Voici ton tableau de bord."}
        actions={
          <Button asChild variant="brand">
            <Link href="/onboarding">
              <Sparkles className="h-4 w-4" />
              Nouveau plan
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Marketing Readiness Score"
          value={`${report.score}/100`}
          href={`/dashboard/rapports/${report.id}`}
        />
        <StatCard
          icon={CalendarCheck}
          label="Plan 30 jours"
          value={`${completedDays}/${totalDays || 30} jours`}
          href="/dashboard/calendrier"
          progress={calendarProgress}
        />
        <StatCard icon={Sparkles} label="Contenus générés" value={`${contentCount ?? 0}`} href="/dashboard/contenu" />
        <StatCard
          icon={Target}
          label="Objectif"
          value={product?.objective ? OBJECTIVE_LABELS[product.objective] : "Non défini"}
          href="/dashboard/produit"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actions d'aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            {todayActions && todayActions.length > 0 ? (
              <ul className="space-y-3">
                {todayActions.map((action) => (
                  <li key={action.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {action.sort_order + 1}
                    </span>
                    {action.action}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune action prévue pour aujourd'hui.</p>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-4">
              <Link href="/dashboard/premiers-clients">
                Voir le plan complet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derniers rapports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.slice(0, 4).map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/rapports/${r.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.productName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                </div>
                <Badge variant="secondary">{r.score}/100</Badge>
              </Link>
            ))}
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/dashboard/rapports">
                <FileBarChart className="h-4 w-4" />
                Tous les rapports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  progress?: number;
}) {
  return (
    <Link href={href}>
      <Card className="card-hover h-full">
        <CardContent className="p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-lg font-semibold">{value}</p>
          {typeof progress === "number" && <Progress value={progress} className="mt-3 h-1.5" />}
        </CardContent>
      </Card>
    </Link>
  );
}
