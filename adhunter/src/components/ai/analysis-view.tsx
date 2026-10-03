import { AlertTriangle, CheckCircle2, Lightbulb, Megaphone, Target, Wrench, XCircle } from "lucide-react";

import { DemoBadge } from "@/components/app/ui-bits";
import type { AdAnalysis } from "@/lib/ai/schemas";

function Section({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-violet-400" /> {title}
      </h3>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function AnalysisDisclaimer() {
  return (
    <p className="flex gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      Analyse générée par IA à partir des informations publiques de la publicité. Il s'agit d'estimations, et non de données de performance vérifiées.
    </p>
  );
}

export function AnalysisView({ analysis, isDemo }: { analysis: AdAnalysis; isDemo?: boolean }) {
  return (
    <div className="space-y-4">
      {isDemo && (
        <p className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <DemoBadge /> Résultat de démonstration — non généré par l'IA (clé API non configurée).
        </p>
      )}
      {!isDemo && <AnalysisDisclaimer />}
      <div className="surface p-5">
        <p className="text-sm leading-relaxed">{analysis.summary}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={Megaphone} title="Accroche">
          <blockquote className="border-l-2 border-primary pl-3 text-foreground">« {analysis.hook.text} »</blockquote>
          <p className="mt-2"><span className="text-foreground">Type :</span> {analysis.hook.type}</p>
          <p className="mt-1">{analysis.hook.analysis}</p>
        </Section>
        <Section icon={Target} title="Public cible probable">
          <p>{analysis.target_audience.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {analysis.target_audience.segments.map((s) => (
              <span key={s} className="rounded-full border border-border px-2 py-0.5 text-xs">{s}</span>
            ))}
          </div>
          <p className="mt-2 text-xs"><span className="text-foreground">Niveau de conscience :</span> {analysis.target_audience.awareness_level}</p>
        </Section>
        <Section icon={Wrench} title="Problème traité">
          <p>{analysis.problem_solved}</p>
        </Section>
        <Section icon={Lightbulb} title="Techniques marketing">
          <ul className="space-y-2">
            {analysis.marketing_techniques.map((t) => (
              <li key={t.name}><span className="text-foreground">{t.name}</span> — {t.explanation}</li>
            ))}
          </ul>
        </Section>
        <Section icon={CheckCircle2} title="Ce qui rend la publicité intéressante">
          <ul className="list-disc space-y-1 pl-4">{analysis.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </Section>
        <Section icon={XCircle} title="Faiblesses possibles">
          <ul className="list-disc space-y-1 pl-4">{analysis.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul>
        </Section>
      </div>
      <section>
        <h3 className="mb-3 text-sm font-semibold">3 idées de publicités originales</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {analysis.ad_ideas.map((idea, i) => (
            <article key={i} className="surface p-5">
              <p className="font-mono text-[11px] text-violet-400">Idée {i + 1} · {idea.format}</p>
              <h4 className="mt-1 font-medium">{idea.title}</h4>
              <p className="mt-2 text-sm text-foreground">« {idea.hook} »</p>
              <p className="mt-2 text-sm text-muted-foreground">{idea.concept}</p>
            </article>
          ))}
        </div>
      </section>
      <Section icon={Lightbulb} title="Recommandations pour ta propre publicité">
        <ol className="list-decimal space-y-1.5 pl-4">{analysis.recommendations.map((r) => <li key={r}>{r}</li>)}</ol>
      </Section>
      <p className="text-xs text-muted-foreground"><span className="text-foreground">Limites de l'analyse :</span> {analysis.confidence_note}</p>
    </div>
  );
}
