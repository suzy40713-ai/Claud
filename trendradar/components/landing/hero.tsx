import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-glow px-6 pb-24 pt-20 text-center md:pt-32">
      <div className="mx-auto max-w-4xl animate-fade-up">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70">
          🎯 Propulsé par l'IA
        </span>
        <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Ne cherche plus{" "}
          <span className="text-gradient">quoi publier</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 md:text-xl">
          TrendRadar utilise l'IA pour trouver des idées de contenu adaptées à ta niche,
          pour TikTok, Instagram Reels et YouTube Shorts.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="w-full rounded-xl bg-accent-gradient px-8 py-4 text-base font-semibold shadow-xl shadow-accent/25 transition hover:scale-[1.02] hover:opacity-90 sm:w-auto"
          >
            Commencer gratuitement
          </Link>
          <a
            href="#example"
            className="w-full rounded-xl border border-white/15 px-8 py-4 text-base font-semibold text-white/80 transition hover:bg-white/5 sm:w-auto"
          >
            Voir un exemple
          </a>
        </div>
        <p className="mt-4 text-sm text-white/40">
          5 recherches gratuites par mois · Aucune carte bancaire requise
        </p>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl animate-float">
        <div className="glass-card rounded-2xl p-6 text-left shadow-2xl md:p-10">
          <div className="mb-4 flex items-center gap-2 text-xs text-white/40">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-amber-500/60" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
            <span className="ml-2">trendradar.app/dashboard</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { score: 92, title: "5 joueurs que personne ne pensait capables de faire ça" },
              { score: 81, title: "Le classement le plus controversé du football" },
              { score: 76, title: "3 secrets d'entraînement des pros" },
            ].map((idea) => (
              <div key={idea.title} className="rounded-xl border border-white/10 bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-white/40">
                    Opportunity Score
                  </span>
                  <span className="text-lg font-bold text-accent-light">{idea.score}/100</span>
                </div>
                <p className="text-sm font-medium text-white/90">{idea.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
