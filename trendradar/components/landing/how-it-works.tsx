const steps = [
  {
    step: "1",
    title: "Indique ta niche",
    description:
      "Football, cuisine, finance, beauté... décris ton univers de créateur en quelques mots.",
  },
  {
    step: "2",
    title: "Choisis plateforme & style",
    description:
      "TikTok, Instagram ou YouTube Shorts. Éducatif, storytelling, classement, humour...",
  },
  {
    step: "3",
    title: "Reçois tes idées notées",
    description:
      "20 idées complètes avec hook, concept, CTA, hashtags et Opportunity Score.",
  },
  {
    step: "4",
    title: "Génère le script et publie",
    description:
      "Transforme n'importe quelle idée en script prêt à tourner, en un clic.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Comment ça marche</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
        De l'idée à la publication, en quatre étapes.
      </p>
      <div className="mt-14 grid gap-6 md:grid-cols-4">
        {steps.map((s) => (
          <div key={s.step} className="glass-card rounded-2xl p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-gradient text-sm font-bold">
              {s.step}
            </div>
            <h3 className="mb-2 font-semibold">{s.title}</h3>
            <p className="text-sm text-white/60">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
