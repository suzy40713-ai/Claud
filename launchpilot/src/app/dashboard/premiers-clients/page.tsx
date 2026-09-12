import { Users, Sun, CalendarRange, CalendarClock } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, getReportBundle } from "@/lib/data/reports";
import type { Tables } from "@/types/database";

export default async function FirstCustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const latest = await getLatestReport(supabase, user.id);

  if (!latest) {
    return (
      <div>
        <PageHeader title="Premiers clients" description="Le plan pour obtenir tes premiers clients." />
        <EmptyState
          icon={Users}
          title="Aucun plan disponible"
          description="Génère ton plan marketing pour recevoir tes actions concrètes vers tes premiers clients."
          actionLabel="Créer mon plan"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  const { firstCustomerActions } = await getReportBundle(supabase, latest.id, user.id);
  const grouped = groupByTimeframe(firstCustomerActions);

  return (
    <div className="space-y-6">
      <PageHeader title="Premiers clients" description="Des actions concrètes, du jour au mois." />

      <div className="grid gap-4 lg:grid-cols-3">
        <TimeframeCard icon={Sun} title="Aujourd'hui" items={grouped.today} accent="border-primary/30 bg-primary/5" />
        <TimeframeCard icon={CalendarRange} title="Cette semaine" items={grouped.week} />
        <TimeframeCard icon={CalendarClock} title="Ce mois-ci" items={grouped.month} />
      </div>
    </div>
  );
}

function groupByTimeframe(actions: Tables<"first_customer_actions">[]) {
  return {
    today: actions.filter((a) => a.timeframe === "today"),
    week: actions.filter((a) => a.timeframe === "week"),
    month: actions.filter((a) => a.timeframe === "month"),
  };
}

function TimeframeCard({
  icon: Icon,
  title,
  items,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: Tables<"first_customer_actions">[];
  accent?: string;
}) {
  return (
    <Card className={accent}>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Icon className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune action.</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, i) => (
              <li key={item.id} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                  {i + 1}
                </span>
                {item.action}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
