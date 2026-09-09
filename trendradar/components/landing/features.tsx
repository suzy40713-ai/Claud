const features = [
  {
    icon: "🎯",
    title: "Opportunity Score",
    description:
      "Chaque idée est notée sur 100 selon sa curiosité, clarté, rétention, partage et originalité.",
  },
  {
    icon: "📝",
    title: "Génération de scripts",
    description:
      "Hook, intro, développement, conclusion et CTA générés automatiquement, prêts à tourner.",
  },
  {
    icon: "🔀",
    title: "Variantes d'idées",
    description: "Décline chaque idée en plusieurs angles différents en un clic.",
  },
  {
    icon: "📡",
    title: "Radar de tendances",
    description:
      "Repère les angles en progression, à surveiller ou encore sous-exploités dans ta niche.",
  },
  {
    icon: "🔍",
    title: "Analyse d'idée",
    description:
      "Soumets ta propre idée et reçois un score détaillé + 3 versions améliorées.",
  },
  {
    icon: "📅",
    title: "Calendrier de contenu",
    description: "Planifie et organise tes prochaines publications semaine après semaine.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Fonctionnalités</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
        Tout ce dont tu as besoin pour ne plus jamais manquer d'idées.
      </p>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="glass-card rounded-2xl p-6 transition hover:border-accent/40"
          >
            <div className="mb-4 text-3xl">{f.icon}</div>
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-white/60">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
