import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, getReportBundle } from "@/lib/data/reports";

export default async function ContentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const latest = await getLatestReport(supabase, user.id);

  if (!latest) {
    return (
      <div>
        <PageHeader title="Contenu" description="30 idées de contenu prêtes à publier." />
        <EmptyState
          icon={Sparkles}
          title="Aucun contenu généré"
          description="Génère ton plan marketing pour recevoir des idées de contenu personnalisées."
          actionLabel="Créer mon plan"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  const { contentIdeas } = await getReportBundle(supabase, latest.id, user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contenu"
        description={`${contentIdeas.length} idées de contenu générées pour ${latest.product?.name ?? "ton produit"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {contentIdeas.map((idea) => (
          <Card key={idea.id} className="flex h-full flex-col">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{idea.platform}</Badge>
                <span className="text-xs text-muted-foreground">#{idea.idx}</span>
              </div>
              <p className="font-semibold leading-snug">{idea.hook}</p>
              <p className="text-xs text-muted-foreground">
                {idea.format} · {idea.objective}
              </p>
              <p className="flex-1 whitespace-pre-line text-sm text-muted-foreground">{idea.script}</p>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs font-medium">CTA : {idea.cta}</span>
                <CopyButton text={`${idea.hook}\n\n${idea.script}\n\nCTA: ${idea.cta}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
