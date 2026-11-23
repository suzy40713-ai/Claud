import { Check, Sparkles, Target } from "lucide-react";

/**
 * Illustration du copilote marketing (exemple fictif, purement visuel) :
 * l'analyse d'un produit et les actions du jour proposées par l'Autopilot.
 */
const ACTIONS = [
  { label: "Publier une vidéo TikTok « avant / après »", done: true },
  { label: "Réécrire la description du produit", done: true },
  { label: "Tester une nouvelle accroche publicitaire", done: false },
];

export function CopilotPreview() {
  return (
    <div
      className="relative"
      role="img"
      aria-label="Aperçu illustratif du copilote marketing BookSync (exemple fictif)"
    >
      <div className="grid gap-4 sm:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border bg-card p-6 shadow-xl shadow-primary/10">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
            <Target className="size-4" /> Analyse du produit
          </p>
          <p className="mt-3 text-lg font-semibold">Bougies parfumées « Lumi »</p>
          <p className="text-sm text-muted-foreground">24 € · fait main · vente en ligne</p>
          <dl className="mt-5 grid gap-3 text-sm">
            {[
              [
                "Proposition de valeur",
                "Une ambiance cocooning, coulée à la main en petites séries.",
              ],
              ["Clients cibles", "Hypothèse à vérifier : 25-40 ans qui offrent des cadeaux."],
              ["Point faible", "Pas encore d'avis clients sur la page."],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-3xl bg-navy p-6 text-white shadow-xl">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#8fa8ff] uppercase">
            <Sparkles className="size-4" /> Autopilot · jour 4/30
          </p>
          <p className="mt-3 text-lg font-semibold">Aujourd&apos;hui, 3 actions</p>
          <ul className="mt-5 grid gap-3 text-sm">
            {ACTIONS.map((a) => (
              <li key={a.label} className="flex gap-3">
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${a.done ? "border-transparent bg-[#2f5bff]" : "border-white/30"}`}
                >
                  {a.done ? <Check className="size-3.5" /> : null}
                </span>
                <span className={a.done ? "text-white/60 line-through" : ""}>{a.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[13%] rounded-full bg-[#2f5bff]" />
          </div>
          <p className="mt-2 text-xs text-white/50">Progression de la stratégie sur 30 jours</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Illustration — exemple fictif
      </p>
    </div>
  );
}
