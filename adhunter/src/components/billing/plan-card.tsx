import { Check } from "lucide-react";

import { formatPrice, cn } from "@/lib/utils";
import type { PlanDefinition } from "@/lib/plans";

export function PlanCard({
  plan,
  highlighted,
  current,
  action,
}: {
  plan: PlanDefinition;
  highlighted?: boolean;
  current?: boolean;
  action: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all",
        highlighted ? "border-primary/60 shadow-glow" : "border-border"
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-white">Recommandé</span>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        {current && <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs text-violet-400">Formule actuelle</span>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{formatPrice(plan.priceCents)}</span>
        <span className="text-sm text-muted-foreground">/ mois TTC</span>
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.highlights.map((h) => (
          <li key={h} className="flex gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">{action}</div>
    </article>
  );
}
