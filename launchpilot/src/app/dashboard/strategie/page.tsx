import { Target, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, getReportBundle } from "@/lib/data/reports";

const DIFFICULTY_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  facile: "success",
  moyen: "warning",
  difficile: "destructive",
};

const POTENTIAL_LABEL: Record<string, string> = {
  faible: "Potentiel faible",
  moyen: "Potentiel moyen",
  eleve: "Potentiel élevé",
};

export default async function StrategyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const latest = await getLatestReport(supabase, user.id);

  if (!latest) {
    return (
      <div>
        <PageHeader title="Stratégie" description="Positionnement, offre et acquisition." />
        <EmptyState
          icon={Target}
          title="Aucune stratégie pour le moment"
          description="Génère ton plan marketing pour découvrir ton positionnement, ton offre et tes stratégies d'acquisition."
          actionLabel="Créer mon plan"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  const { positioning, offer, acquisitionStrategies } = await getReportBundle(supabase, latest.id, user.id);
  const freeStrategies = acquisitionStrategies.filter((s) => s.budget_tier === "free");
  const budgetStrategies = acquisitionStrategies.filter((s) => s.budget_tier === "small_budget");

  return (
    <div className="space-y-6">
      <PageHeader title="Stratégie" description="Ton positionnement, ton offre et tes canaux d'acquisition." />

      <Tabs defaultValue="positioning">
        <TabsList>
          <TabsTrigger value="positioning">Positionnement</TabsTrigger>
          <TabsTrigger value="offer">Offre</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
        </TabsList>

        <TabsContent value="positioning" className="space-y-4">
          {positioning ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Proposition de valeur</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{positioning.value_proposition}</p>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard label="Problème" value={positioning.problem} />
                <InfoCard label="Solution" value={positioning.solution} />
                <InfoCard label="Différenciation" value={positioning.differentiation} />
                <InfoCard label="Bénéfice principal" value={positioning.main_benefit} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Elevator pitch</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{positioning.elevator_pitch}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Arguments de vente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {positioning.selling_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Positionnement indisponible.</p>
          )}
        </TabsContent>

        <TabsContent value="offer" className="space-y-4">
          {offer ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Comment rendre ton offre plus attractive</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoCard label="Offre principale" value={offer.main_offer} />
                  {offer.bonuses.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bonus</p>
                      <ul className="space-y-1 text-sm">
                        {offer.bonuses.map((b, i) => (
                          <li key={i}>• {b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {offer.guarantee && <InfoCard label="Garantie" value={offer.guarantee} />}
                    {offer.urgency && <InfoCard label="Urgence" value={offer.urgency} />}
                  </div>
                  <InfoCard label="Appel à l'action (CTA)" value={offer.cta} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Objections à traiter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {offer.objections.map((o, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 text-sm">
                      <p className="font-medium">"{o.objection}"</p>
                      <p className="mt-1 text-muted-foreground">{o.response}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground">
                LaunchPilot ne recommande jamais de fausses garanties, faux avis ou fausse urgence — adapte ces
                suggestions à ta situation réelle.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Offre indisponible.</p>
          )}
        </TabsContent>

        <TabsContent value="acquisition" className="space-y-6">
          <StrategyGroup title="Stratégies gratuites" strategies={freeStrategies} />
          <StrategyGroup title="Stratégies à petit budget" strategies={budgetStrategies} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function StrategyGroup({
  title,
  strategies,
}: {
  title: string;
  strategies: Array<{
    id: string;
    channel: string;
    description: string;
    difficulty: string;
    cost: string;
    time_required: string;
    potential: string;
    first_action: string;
  }>;
}) {
  if (strategies.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {strategies.map((s) => (
          <Card key={s.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{s.channel}</p>
                <Badge variant={DIFFICULTY_VARIANT[s.difficulty] ?? "secondary"} className="capitalize">
                  {s.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>💰 {s.cost}</span>
                <span>⏱️ {s.time_required}</span>
                <span>📈 {POTENTIAL_LABEL[s.potential] ?? s.potential}</span>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3 text-sm">
                <span className="font-medium">Première action : </span>
                {s.first_action}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
