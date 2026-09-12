import { FileText, Search, Sparkles, Rocket } from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Décris ton produit", description: "Réponds à quelques questions sur ton produit, ton client et tes ressources." },
  { icon: Search, title: "LaunchPilot analyse ton marché", description: "L'IA identifie ton positionnement, ton client idéal et tes opportunités." },
  { icon: Sparkles, title: "Reçois ton plan personnalisé", description: "Stratégie, contenu, calendrier et campagnes, adaptés à ton produit et ton budget." },
  { icon: Rocket, title: "Exécute et obtiens tes premiers clients", description: "Suis ton plan d'action jour par jour et coche tes progrès." },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Comment ça fonctionne</h2>
          <p className="mt-3 text-muted-foreground">De l'idée à tes premiers clients, en 4 étapes.</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
                <step.icon className="h-5 w-5" />
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Étape {i + 1}</p>
              <h3 className="mb-2 font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
