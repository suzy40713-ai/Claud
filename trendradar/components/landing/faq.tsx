const faqs = [
  {
    q: "Les idées sont-elles garanties de devenir virales ?",
    a: "Non. L'Opportunity Score est une estimation IA basée sur les caractéristiques du concept (curiosité, clarté, potentiel de rétention et de partage, originalité). Ce n'est jamais une garantie de performance réelle.",
  },
  {
    q: "Le Radar utilise-t-il des données de tendances en temps réel ?",
    a: "Pas encore par défaut : les signaux du Radar sont des estimations qualitatives générées par IA, clairement identifiées comme telles. L'architecture est prête pour connecter Google Trends et des APIs sociales dès qu'elles seront disponibles.",
  },
  {
    q: "Comment fonctionne le système de crédits ?",
    a: "Chaque recherche consomme un crédit de recherche, et chaque recherche génère un nombre d'idées selon ton plan. Les crédits se renouvellent chaque mois selon ton abonnement.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, l'abonnement est mensuel sans engagement. Tu peux gérer ou annuler ton abonnement à tout moment depuis ton espace de facturation.",
  },
  {
    q: "Quelles plateformes sont supportées ?",
    a: "TikTok, Instagram Reels et YouTube Shorts. Chaque idée et script est adapté au format de la plateforme choisie.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Questions fréquentes</h2>
      <div className="mt-12 space-y-4">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group glass-card rounded-xl p-5 open:pb-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              {item.q}
              <span className="ml-4 text-white/40 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-white/60">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
