import Link from "next/link";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <div className="glass-card rounded-3xl bg-hero-glow p-12">
        <h2 className="text-3xl font-bold md:text-4xl">
          Prêt à ne plus jamais manquer d'idées ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Rejoins TrendRadar et trouve ta prochaine vidéo en moins de 30 secondes.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-xl bg-accent-gradient px-8 py-4 text-base font-semibold shadow-xl shadow-accent/25 transition hover:scale-[1.02] hover:opacity-90"
        >
          Commencer gratuitement
        </Link>
      </div>
    </section>
  );
}
