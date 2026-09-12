import { Lightbulb } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/types/database";

export function PersonaCard({ persona }: { persona: Tables<"personas"> }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Client idéal</CardTitle>
        {persona.is_hypothesis && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Lightbulb className="h-3 w-3" />
            Hypothèse marketing
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{persona.is_hypothesis && "Ce persona est une hypothèse raisonnée basée sur les informations fournies, pas une donnée vérifiée. "}{persona.profile_summary}</p>

        <PersonaList label="Problème principal" items={[persona.main_problem]} />
        <div className="grid gap-5 sm:grid-cols-2">
          <PersonaList label="Objectifs" items={persona.goals} />
          <PersonaList label="Frustrations" items={persona.frustrations} />
          <PersonaList label="Motivations" items={persona.motivations} />
          <PersonaList label="Objections" items={persona.objections} />
          <PersonaList label="Où le trouver" items={persona.where_to_find} />
          <PersonaList label="Contenu consommé" items={persona.content_consumed} />
        </div>
      </CardContent>
    </Card>
  );
}

function PersonaList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
