export function ExampleResult() {
  return (
    <section id="example" className="mx-auto max-w-4xl px-6 py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Exemple de résultat</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
        Voici ce que TrendRadar génère pour la niche "Football" sur TikTok.
      </p>

      <div className="glass-card mt-12 rounded-2xl p-8">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-white/40">
              Opportunity Score
            </span>
            <p className="text-4xl font-extrabold text-accent-light">87/100</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Fort potentiel
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Titre</p>
            <p className="mt-1 text-lg font-semibold">
              « 5 joueurs que personne ne pensait capables de faire ça »
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Hook</p>
            <p className="mt-1 text-white/80">
              « Le numéro 3 va probablement te surprendre... »
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Concept</p>
            <p className="mt-1 text-white/80">
              Un classement rythmé de 5 exploits techniques méconnus, avec ralentis et
              réactions, pour créer de la curiosité jusqu'au dernier joueur révélé.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">CTA</p>
            <p className="mt-1 text-white/80">« Tu en connaissais combien ? »</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {["Générer le script", "Créer 5 variantes", "Sauvegarder", "Copier"].map((label) => (
            <span
              key={label}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
