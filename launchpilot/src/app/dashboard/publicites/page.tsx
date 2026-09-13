import { AlertCircle, Megaphone } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, getReportBundle } from "@/lib/data/reports";

export default async function AdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const latest = await getLatestReport(supabase, user.id);

  if (!latest) {
    return (
      <div>
        <PageHeader title="Publicités" description="5 concepts publicitaires prêts à tester." />
        <EmptyState
          icon={Megaphone}
          title="Aucun concept publicitaire"
          description="Génère ton plan marketing pour recevoir des concepts de publicité."
          actionLabel="Créer mon plan"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  const { ads } = await getReportBundle(supabase, latest.id, user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Publicités" description="5 concepts publicitaires à tester avec un petit budget." />

      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Les résultats publicitaires ne sont jamais garantis — teste avec un petit budget avant de scaler.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ads.map((ad) => (
          <Card key={ad.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{ad.platform}</Badge>
                <Badge variant="outline">{ad.angle}</Badge>
              </div>
              <p className="font-semibold leading-snug">{ad.hook}</p>
              <p className="text-sm text-muted-foreground">{ad.primary_text}</p>
              <p className="text-sm font-medium">{ad.headline}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Audience : </span>
                {ad.target_audience}
              </p>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs font-medium">CTA : {ad.cta}</span>
                <CopyButton
                  text={`${ad.headline}\n\n${ad.primary_text}\n\nCTA: ${ad.cta}\nAudience: ${ad.target_audience}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
