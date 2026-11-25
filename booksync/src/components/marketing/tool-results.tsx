import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { BASIS_LABELS } from "@/domain/marketing/analysis";
import { AddToPlanButton } from "@/app/tableau-de-bord/autopilot-marketing/controls";
import { GOOGLE_LIMITS, type AdOutput } from "@/domain/marketing/tools/ad";
import type { CompetitorsOutput } from "@/domain/marketing/tools/competitors";
import type { ContentOutput } from "@/domain/marketing/tools/content";
import type { CustomersOutput } from "@/domain/marketing/tools/customers";
import type { SalesOutput } from "@/domain/marketing/tools/sales";
import type { Strategy } from "@/domain/marketing/tools/strategy";

function Card({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        {aside}
      </div>
      <div className="mt-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

export function StrategyView({ s }: { s: Strategy }) {
  const days = [...s.days].sort((a, b) => a.day - b.day);
  return (
    <div className="grid gap-4" data-testid="strategy-view">
      <Card title="La stratégie">
        <p>{s.summary}</p>
        <p className="mt-3 font-medium">Positionnement : {s.positioning}</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Objectifs">
          <ul className="list-disc pl-5">
            {s.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Card>
        <Card title="Budget indicatif">
          <p className="font-medium">{s.budget.total}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {s.budget.split.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Card>
        <Card title="Stratégie de lancement">
          <ol className="list-decimal pl-5">
            {s.launch.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ol>
        </Card>
        <Card title="Trouver vos premiers clients">
          <ul className="list-disc pl-5">
            {s.firstClients.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Thèmes de contenu">
          <ul className="grid gap-2">
            {s.pillars.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.title}</span> : {p.description}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Canaux">
          <ul className="grid gap-2">
            {s.channels.map((c, i) => (
              <li key={i}>
                <span className="font-medium">{c.channel}</span> ({c.frequency}) : {c.role}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card title="Calendrier sur 30 jours">
        <div className="grid gap-3" data-testid="strategy-calendar">
          {[1, 2, 3, 4, 5].map((w) => {
            const list = days.filter((d) => Math.min(5, Math.ceil(d.day / 7)) === w);
            if (!list.length) return null;
            const focus = s.weeks.find((x) => x.week === w)?.focus;
            return (
              <details key={w} open={w === 1} className="rounded-xl border p-3">
                <summary className="cursor-pointer font-medium">
                  {w === 5 ? "Jours 29 et 30" : `Semaine ${w}`}
                  {focus ? (
                    <span className="font-normal text-muted-foreground"> · {focus}</span>
                  ) : null}
                </summary>
                <ol className="mt-3 grid gap-3">
                  {list.map((d) => (
                    <li key={d.day}>
                      <p className="font-medium">
                        Jour {d.day} · {d.theme}
                      </p>
                      <ul className="mt-1 grid gap-1 text-sm">
                        {d.actions.map((a, i) => (
                          <li key={i}>
                            <Badge variant="outline" className="mr-1.5">
                              {a.channel}
                            </Badge>
                            <span className="font-medium">{a.title}</span>
                            <span className="text-muted-foreground"> · {a.detail}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </details>
            );
          })}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Ce qu'il faut mesurer">
          <ul className="grid gap-2">
            {s.measure.map((m, i) => (
              <li key={i}>
                <span className="font-medium">{m.metric}</span> : {m.how}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Hypothèses de départ">
          <ul className="grid gap-2">
            {s.assumptions.map((a, i) => (
              <li key={i}>
                {a.text}{" "}
                <Badge variant={a.basis === "fourni" ? "primary" : "warning"}>
                  {BASIS_LABELS[a.basis]}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Count({ text, max }: { text: string; max: number }) {
  const over = text.length > max;
  return (
    <span className={over ? "text-destructive" : "text-muted-foreground"}>
      {" "}
      ({text.length}/{max}
      {over ? " : trop long, à raccourcir" : ""})
    </span>
  );
}

export function AdView({ ad, google }: { ad: AdOutput; google: boolean }) {
  return (
    <div className="grid gap-4" data-testid="ad-view">
      {ad.variants.map((v, i) => (
        <Card
          key={i}
          title={`Variante ${i + 1} · ${v.angle}`}
          aside={
            <CopyButton label="Copier" value={`${v.headline}\n\n${v.primaryText}\n\n${v.cta}`} />
          }
        >
          <p className="font-semibold">
            {v.headline}
            {google ? <Count text={v.headline} max={GOOGLE_LIMITS.headline} /> : null}
          </p>
          <p className="mt-2 whitespace-pre-line">
            {v.primaryText}
            {google ? <Count text={v.primaryText} max={GOOGLE_LIMITS.description} /> : null}
          </p>
          <p className="mt-2">
            <Badge variant="primary">{v.cta}</Badge>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Visuel : {v.visual}</p>
          {v.script.length ? (
            <ol className="mt-3 grid gap-1 text-sm">
              {v.script.map((l, j) => (
                <li key={j}>
                  <span className="font-mono text-muted-foreground">{l.time}</span> {l.text}
                </li>
              ))}
            </ol>
          ) : null}
        </Card>
      ))}
      {ad.keywords.length ? (
        <Card
          title="Mots-clés à tester"
          aside={<CopyButton label="Copier" value={ad.keywords.join("\n")} />}
        >
          <p>{ad.keywords.join(" · ")}</p>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Ciblage (hypothèses à tester)">
          <ul className="list-disc pl-5">
            {ad.targeting.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
        <Card title="Comment tester">
          <p>{ad.testPlan}</p>
        </Card>
      </div>
      <Card title="Règles de la plateforme à respecter">
        <ul className="list-disc pl-5">
          {ad.rules.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function ContentView({ c }: { c: ContentOutput }) {
  return (
    <div className="grid gap-4" data-testid="content-view">
      {c.pieces.map((p, i) => {
        const full = [
          `Accroche : ${p.hook}`,
          ...p.development,
          `Produit : ${p.productMoment}`,
          `Appel à l'action : ${p.cta}`,
          "",
          p.caption,
          p.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" "),
        ].join("\n");
        return (
          <Card
            key={i}
            title={`${i + 1}. ${p.title}`}
            aside={<CopyButton label="Copier" value={full} />}
          >
            <p>
              <span className="font-semibold">Accroche :</span> {p.hook}
            </p>
            <ol className="mt-2 list-decimal pl-5">
              {p.development.map((d, j) => (
                <li key={j}>{d}</li>
              ))}
            </ol>
            <p className="mt-2">
              <span className="font-semibold">Produit :</span> {p.productMoment}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Appel à l&apos;action :</span> {p.cta}
            </p>
            {p.onScreenText ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Texte à l&apos;écran : {p.onScreenText}
              </p>
            ) : null}
            <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
              <p className="whitespace-pre-line">{p.caption}</p>
              <p className="mt-2 text-primary">
                {p.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
              </p>
            </div>
          </Card>
        );
      })}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Semaine de publication">
          <ul className="grid gap-1">
            {c.calendar.map((d, i) => (
              <li key={i}>
                <span className="font-medium">{d.day}</span> : {d.piece}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Conseils">
          <ul className="list-disc pl-5">
            {c.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

const EFFORT = { faible: "success", moyen: "warning", important: "destructive" } as const;

export function SalesView({ s, canPlan = false }: { s: SalesOutput; canPlan?: boolean }) {
  return (
    <div className="grid gap-4" data-testid="sales-view">
      <Card title="Diagnostic (hypothèse)">
        <p>{s.diagnosis}</p>
      </Card>
      <Card title="Améliorations rapides">
        <ol className="grid list-decimal gap-2 pl-5">
          {s.quickWins.map((q, i) => (
            <li key={i}>
              <span className="font-medium">{q.action}</span>{" "}
              <Badge variant={EFFORT[q.effort]}>effort {q.effort}</Badge>
              <p className="text-muted-foreground">{q.why}</p>
              {canPlan ? <AddToPlanButton title={q.action} detail={q.why} /> : null}
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Textes proposés">
        <ul className="grid gap-3">
          {s.rewrites.map((r, i) => (
            <li key={i} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{r.element}</p>
                <p>{r.proposal}</p>
              </div>
              <CopyButton label="Copier" value={r.proposal} />
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Tests A/B">
        <ul className="grid gap-3">
          {s.abTests.map((t, i) => (
            <li key={i}>
              <p className="font-medium">{t.element}</p>
              <p>A : {t.versionA}</p>
              <p>B : {t.versionB}</p>
              <p className="text-sm text-muted-foreground">À mesurer : {t.measure}</p>
            </li>
          ))}
        </ul>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Confiance (seulement si c'est vrai)">
          <ul className="list-disc pl-5">
            {s.trust.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
        <Card title="Augmenter le panier">
          <ul className="list-disc pl-5">
            {s.upsell.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function CustomersView({ c }: { c: CustomersOutput }) {
  return (
    <div className="grid gap-4" data-testid="customers-view">
      {c.personas.map((p, i) => (
        <Card
          key={i}
          title={p.name}
          aside={
            <Badge variant={p.basis === "fourni" ? "primary" : "warning"}>
              {BASIS_LABELS[p.basis]}
            </Badge>
          }
        >
          <p>{p.description}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Besoins", p.needs],
                ["Problèmes", p.problems],
                ["Motivations d'achat", p.motivations],
                ["Arguments adaptés", p.arguments],
              ] as const
            ).map(([label, list]) => (
              <div key={label}>
                <p className="text-sm font-semibold">{label}</p>
                <ul className="list-disc pl-5 text-sm">
                  {list.map((x, j) => (
                    <li key={j}>{x}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm">
            <span className="font-semibold">Centres d&apos;intérêt :</span>{" "}
            {p.interests.join(" · ")}
          </p>
          <ul className="mt-2 grid gap-1 text-sm">
            {p.channels.map((ch, j) => (
              <li key={j}>
                <Badge variant="outline" className="mr-1.5">
                  {ch.platform}
                </Badge>
                {ch.how}
              </li>
            ))}
          </ul>
        </Card>
      ))}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="À vérifier auprès de vrais clients">
          <ul className="list-disc pl-5">
            {c.toVerify.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
        <Card title="Cette semaine">
          <ol className="list-decimal pl-5">
            {c.firstSteps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

export function CompetitorsView({
  c,
  canPlan = false,
}: {
  c: CompetitorsOutput;
  canPlan?: boolean;
}) {
  return (
    <div className="grid gap-4" data-testid="competitors-view">
      {c.competitors.length === 0 ? (
        <Card title="Concurrents">
          <p className="text-muted-foreground">
            Aucune adresse fournie : ajoutez le site de 1 à 3 concurrents pour une analyse
            détaillée.
          </p>
        </Card>
      ) : null}
      {c.competitors.map((x, i) => (
        <Card
          key={i}
          title={x.name}
          aside={
            <Badge variant={x.basis === "fourni" ? "primary" : "warning"}>
              {x.basis === "fourni" ? "D'après leur page" : "Hypothèse à vérifier"}
            </Badge>
          }
        >
          {x.url ? <p className="truncate text-sm text-muted-foreground">{x.url}</p> : null}
          <p className="mt-2">
            <span className="font-semibold">Positionnement :</span> {x.positioning}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Offres", x.offers],
                ["Prix trouvés", x.prices],
                ["Arguments", x.arguments],
                ["Points forts", x.strengths],
                ["Points faibles", x.weaknesses],
              ] as const
            ).map(([label, list]) =>
              list.length ? (
                <div key={label}>
                  <p className="text-sm font-semibold">{label}</p>
                  <ul className="list-disc pl-5 text-sm">
                    {list.map((y, j) => (
                      <li key={j}>{y}</li>
                    ))}
                  </ul>
                </div>
              ) : label === "Prix trouvés" ? (
                <p key={label} className="text-sm text-muted-foreground">
                  Aucun prix trouvé sur la page.
                </p>
              ) : null,
            )}
          </div>
        </Card>
      ))}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Comment vous différencier">
          <ul className="grid list-disc gap-1 pl-5">
            {c.differentiation.map((t, i) => (
              <li key={i}>
                {t}
                {canPlan ? (
                  <AddToPlanButton title={t} detail="Idée issue de l'analyse de la concurrence." />
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Opportunités">
          <ul className="list-disc pl-5">
            {c.opportunities.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground">{c.limits}</p>
    </div>
  );
}
