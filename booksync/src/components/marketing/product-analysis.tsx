import { Badge } from "@/components/ui/badge";
import {
  BASIS_LABELS,
  POTENTIAL_LABELS,
  type Basis,
  type ProductAnalysis,
} from "@/domain/marketing/analysis";

function BasisBadge({ basis }: { basis: Basis }) {
  return (
    <Badge variant={basis === "fourni" ? "primary" : "warning"} className="ml-1.5 align-middle">
      {BASIS_LABELS[basis]}
    </Badge>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="mt-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

/** Affichage d'une analyse de produit (données validées par le schéma). */
export function ProductAnalysisView({ analysis }: { analysis: ProductAnalysis }) {
  return (
    <div className="grid gap-4" data-testid="product-analysis">
      <Section title="En résumé">
        <p>{analysis.summary}</p>
        <p className="mt-3 font-medium">Positionnement proposé : {analysis.positioning}</p>
      </Section>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Présentation commerciale">
          <p>{analysis.pitch}</p>
        </Section>
        <Section title="Potentiel commercial (estimation)">
          <p className="font-semibold">
            {POTENTIAL_LABELS[analysis.potential.level]}
            <Badge variant="warning" className="ml-1.5 align-middle">
              Hypothèse à vérifier
            </Badge>
          </p>
          <p className="mt-1">{analysis.potential.reasoning}</p>
        </Section>
      </div>
      <Section title="Arguments pour convaincre">
        <ul className="grid list-disc gap-1 pl-5">
          {analysis.sellingArguments.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </Section>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Points forts">
          <ul className="grid gap-2">
            {analysis.strengths.map((s, i) => (
              <li key={i}>
                {s.text}
                <BasisBadge basis={s.basis} />
              </li>
            ))}
          </ul>
        </Section>
        <Section title="À améliorer">
          <ul className="grid gap-2">
            {analysis.weaknesses.map((s, i) => (
              <li key={i}>
                {s.text}
                <BasisBadge basis={s.basis} />
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <Section title="Qui pourrait acheter">
        <ul className="grid gap-3">
          {analysis.audiences.map((a, i) => (
            <li key={i}>
              <p className="font-medium">
                {a.name}
                <BasisBadge basis={a.basis} />
              </p>
              <p className="text-muted-foreground">{a.description}</p>
              <p>Motivation : {a.motivation}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Prix">
        <p>{analysis.pricing}</p>
      </Section>
      <Section title="Angles et accroches">
        <ul className="grid gap-3">
          {analysis.angles.map((a, i) => (
            <li key={i}>
              <p className="font-medium">{a.title}</p>
              <p className="text-muted-foreground">« {a.hook} »</p>
            </li>
          ))}
        </ul>
      </Section>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Où en parler">
          <ul className="grid gap-2">
            {analysis.channels.map((c, i) => (
              <li key={i}>
                <span className="font-medium">{c.channel}</span> : {c.why}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Objections probables">
          <ul className="grid gap-2">
            {analysis.objections.map((o, i) => (
              <li key={i}>
                <p className="font-medium">« {o.objection} »</p>
                <p className="text-muted-foreground">{o.answer}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <Section title="Recommandations d'amélioration">
        <ul className="grid list-disc gap-1 pl-5">
          {analysis.improvements.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </Section>
      <Section title="À vérifier auprès de vrais clients">
        <ul className="list-disc pl-5">
          {analysis.toVerify.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </Section>
      <Section title="Vos 3 premières actions">
        <ol className="list-decimal pl-5">
          {analysis.firstActions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
