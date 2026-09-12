import Link from "next/link";
import { CalendarDays, Lock } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CalendarDayCard } from "@/components/calendar/calendar-day-card";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, getReportBundle } from "@/lib/data/reports";
import { getCreditStatus } from "@/lib/credits";
import { getPlan } from "@/lib/config/plans";

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

  const [{ calendar, progress }, credits] = await Promise.all([
    getReportBundle(supabase, latest.id, user.id),
    getCreditStatus(user.id),
  ]);

  const plan = getPlan(credits.plan);
  const visibleDays = plan.limits.calendarDays;
  const visible = calendar.filter((d) => d.day_number <= visibleDays);
  const locked = calendar.length - visible.length;

  const progressMap = new Map(progress.map((p) => [p.action_plan_id, p.completed]));
  const completedCount = visible.filter((d) => progressMap.get(d.id)).length;

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
              {completedCount}/{visible.length} jours terminés
            </span>
            <span className="text-muted-foreground">
              {Math.round((completedCount / Math.max(visible.length, 1)) * 100)}%
            </span>
          </div>
          <Progress value={(completedCount / Math.max(visible.length, 1)) * 100} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((day) => (
          <CalendarDayCard key={day.id} day={day} completed={progressMap.get(day.id) ?? false} />
        ))}
      </div>

      {locked > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
            <p className="font-medium">{locked} jours supplémentaires avec le forfait Pro</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Débloque le calendrier complet sur 30 jours pour suivre ton plan jusqu'au bout.
            </p>
            <Button asChild variant="brand">
              <Link href="/dashboard/parametres?tab=abonnement">Passer en Pro</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
