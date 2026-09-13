import { CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CalendarDayCard } from "@/components/calendar/calendar-day-card";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, getReportBundle } from "@/lib/data/reports";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const latest = await getLatestReport(supabase, user.id);

  if (!latest) {
    return (
      <div>
        <PageHeader title="Calendrier 30 jours" description="Ton plan d'action jour par jour." />
        <EmptyState
          icon={CalendarDays}
          title="Aucun calendrier disponible"
          description="Génère ton plan marketing pour obtenir ton calendrier d'actions sur 30 jours."
          actionLabel="Créer mon plan"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  const { calendar, progress } = await getReportBundle(supabase, latest.id, user.id);

  const progressMap = new Map(progress.map((p) => [p.action_plan_id, p.completed]));
  const completedCount = calendar.filter((d) => progressMap.get(d.id)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendrier 30 jours"
        description="Une action concrète par jour, adaptée à ton produit et ton budget."
      />

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {completedCount}/{calendar.length} jours terminés
            </span>
            <span className="text-muted-foreground">
              {Math.round((completedCount / Math.max(calendar.length, 1)) * 100)}%
            </span>
          </div>
          <Progress value={(completedCount / Math.max(calendar.length, 1)) * 100} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {calendar.map((day) => (
          <CalendarDayCard key={day.id} day={day} completed={progressMap.get(day.id) ?? false} />
        ))}
      </div>
    </div>
  );
}
