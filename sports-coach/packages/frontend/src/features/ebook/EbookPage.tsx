import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

const CONTENU = [
  "Un programme d'entrainement complet et progressif sur 12 semaines (3 phases), avec 4 seances par semaine detaillees serie par serie",
  "Une bibliotheque technique illustree : la bonne execution de chaque mouvement, et l'erreur la plus frequente a eviter",
  "Une approche nutrition claire, sans regime extreme : calories, macronutriments, 3 plans alimentaires types",
  "Le role du sommeil, du stress et de la motivation expliques simplement, avec des solutions concretes",
  "8 recettes simples et riches en proteines, prete en moins de 15 minutes",
  "Un carnet de suivi de 12 pages a remplir chaque semaine pour ne rien perdre de ta progression",
  "Une foire aux questions qui repond aux blocages les plus frequents (pas de materiel, debutant complet, emploi du temps charge...)",
];

const RAISONS_ECHEC = [
  {
    titre: "Le programme etait trop complique",
    texte:
      "La plupart des gens abandonnent parce qu'ils ne savent plus quoi faire des la 2e semaine. Ici, chaque seance est ecrite noir sur blanc, jour par jour, sans place au doute.",
  },
  {
    titre: "Aucune vraie progression",
    texte:
      "Faire toujours le meme entrainement fait stagner. Ce livre est construit en 3 phases qui augmentent l'intensite au bon rythme, semaine apres semaine.",
  },
  {
    titre: "La nutrition etait ignoree ou trop stricte",
    texte:
      "Un entrainement sans nutrition adaptee, c'est la moitie du travail. Et un regime trop strict ne tient jamais 90 jours. On vise l'equilibre qui dure.",
  },
];

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function EbookPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<{ configured: boolean; priceCents: number; compareAtPriceCents: number } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutParam = new URLSearchParams(location.search).get("checkout");

  useEffect(() => {
    api.getEbookStatus().then(setStatus);
  }, []);

  async function handleBuy() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.createEbookCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de demarrer le paiement");
      setBusy(false);
    }
  }

  const price = status ? formatPrice(status.priceCents) : "29,99 €";
  const compareAtPrice = status ? formatPrice(status.compareAtPriceCents) : "49,99 €";

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-4 py-4">
        <Link to={user ? "/" : "/login"} className="text-lg font-extrabold tracking-tight text-slate-900">
          👑 Kadence
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {checkoutParam === "succes" && (
          <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Paiement recu, merci ! Ton ebook part vers ta boite mail dans quelques instants — pense a verifier tes
            spams si tu ne le vois pas passer.
          </p>
        )}
        {checkoutParam === "annule" && (
          <p className="mb-6 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            Paiement annule. Tu peux reessayer quand tu veux.
          </p>
        )}
        {status && !status.configured && (
          <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            L'achat n'est pas encore configure sur ce serveur (cles Stripe manquantes).
          </p>
        )}

        <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
          <img
            src={`${import.meta.env.BASE_URL}images/ebook-product.png`}
            alt="Ebook Kadence — Transformation 90 Jours"
            className="w-full rounded-2xl"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-600">Ebook · PDF · 87 pages</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Transformation 90 Jours
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Le protocole complet pour changer ton corps, ta discipline et ta confiance en 3 mois —
              entrainement, nutrition et mental, expliques comme un vrai coach te les expliquerait. Pas de jargon,
              pas de blabla : un plan que tu peux suivre des ce soir.
            </p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-lg text-slate-400 line-through">{compareAtPrice}</span>
              <span className="text-3xl font-extrabold text-slate-900">{price}</span>
              <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-700">
                -40% aujourd'hui
              </span>
            </div>

            <Button disabled={busy || !status?.configured} onClick={handleBuy} className="mt-5 w-full sm:w-auto">
              {busy ? "Redirection..." : "Je recois mon ebook maintenant"}
            </Button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <ul className="mt-5 flex flex-col gap-1.5 text-sm text-slate-500">
              <li>🔒 Paiement securise par Stripe</li>
              <li>📩 Livraison immediate par email, en PDF</li>
              <li>📖 Lisible sur telephone, tablette ou ordinateur</li>
            </ul>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Pourquoi la plupart des transformations physiques echouent
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {RAISONS_ECHEC.map((r) => (
              <div key={r.titre} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900">{r.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.texte}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">Ce que tu vas recevoir</h2>
          <ul className="mt-6 flex flex-col gap-3">
            {CONTENU.map((c) => (
              <li key={c} className="flex gap-3 text-slate-700">
                <span aria-hidden className="mt-0.5 text-pink-600">
                  ✓
                </span>
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-2xl bg-slate-900 px-6 py-8 text-white sm:px-10">
          <p className="text-lg italic leading-relaxed text-slate-200">
            "On a ecrit ce livre comme on aurait aime en recevoir un le premier jour : sans detour, sans te
            vendre du reve, juste un plan clair qui tient la route sur 90 jours."
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-400">— L'equipe Kadence</p>
        </section>

        <section className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Prete a commencer ?</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            Le prochain lot de 90 jours va passer, que tu commences ou non. Autant que ce soit ceux qui te font
            changer.
          </p>
          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-lg text-slate-400 line-through">{compareAtPrice}</span>
            <span className="text-3xl font-extrabold text-slate-900">{price}</span>
          </div>
          <Button disabled={busy || !status?.configured} onClick={handleBuy} className="mt-5">
            {busy ? "Redirection..." : "Je recois mon ebook maintenant"}
          </Button>
        </section>
      </main>
    </div>
  );
}
