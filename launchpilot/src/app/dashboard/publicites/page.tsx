import Link from "next/link";
import { AlertCircle, Lock, Megaphone } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, getReportBundle } from "@/lib/data/reports";
import { getCreditStatus } from "@/lib/credits";
import { getPlan } from "@/lib/config/plans";

export default async function AdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [latest, credits] = await Promise.all([getLatestReport(supabase, user.id), getCreditStatus(user.id)]);
  const plan = getPlan(credits.plan);

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

  if (!plan.limits.adCampaigns) {
    return (
      <div>
        <PageHeader title="Publicités" description="5 concepts publicitaires prêts à tester." />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
            <p className="font-medium">Les concepts publicitaires sont réservés au forfait Pro</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Débloque 5 concepts publicitaires complets (hook, texte, titre, audience) adaptés à ton produit.
            </p>
            <Button asChild variant="brand">
              <Link href="/dashboard/parametres?tab=abonnement">Passer en Pro</Link>
            </Button>
          </CardContent>
        </Card>
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
