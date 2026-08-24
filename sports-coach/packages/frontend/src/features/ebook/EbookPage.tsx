import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
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

const FAQ = [
  {
    q: "Le paiement est-il vraiment sécurisé ?",
    r: "Oui. Le paiement est traité entièrement par Stripe, le même système utilisé par des millions de sites e-commerce. Nous ne voyons ni ne stockons jamais ton numéro de carte.",
  },
  {
    q: "Comment je reçois l'ebook ?",
    r: "Par email, en PDF, dans les minutes qui suivent ton achat (vérifie tes spams si tu ne le vois pas). Aucun compte n'est nécessaire pour acheter.",
  },
  {
    q: "Et si ça ne me convient pas ?",
    r: "Tu es remboursée intégralement si tu écris à suzy40713@gmail.com dans les 14 jours suivant l'achat, sans justification à donner.",
  },
  {
    q: "Je peux le lire où ?",
    r: "Sur téléphone, tablette ou ordinateur — c'est un PDF classique, lisible avec n'importe quelle liseuse ou navigateur.",
  },
  {
    q: "Une question avant d'acheter ?",
    r: "Écris directement à suzy40713@gmail.com, on répond personnellement.",
  },
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function EbookPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<{ configured: boolean; priceCents: number; compareAtPriceCents: number } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const checkoutParam = new URLSearchParams(location.search).get("checkout");

  useEffect(() => {
    api.getEbookStatus().then(setStatus);
  }, []);

  useEffect(() => {
    function onScroll() {
      setShowStickyBar(window.scrollY > 640);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
      <header className="glass-card sticky top-0 z-20 px-4 py-4">
        <Link to={user ? "/" : "/login"} className="text-lg font-extrabold tracking-tight text-slate-900">
          👑 Cadenzo
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

        <div className="relative grid gap-10 sm:grid-cols-2 sm:items-center">
          <div className="bg-gradient-kadence pointer-events-none absolute -left-10 -top-10 h-72 w-72 rounded-full opacity-20 blur-3xl" />
          <motion.img
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            src={`${import.meta.env.BASE_URL}images/ebook-product.png`}
            alt="Ebook Cadenzo — Transformation 90 Jours"
            className="animate-float-slow relative w-full rounded-2xl drop-shadow-2xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
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
              <span className="text-gradient-kadence text-3xl font-extrabold">{price}</span>
              <span className="animate-pulse-glow rounded-full bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-700">
                Offre de lancement -40%
              </span>
            </div>

            <Button disabled={busy || !status?.configured} onClick={handleBuy} className="mt-5 w-full sm:w-auto">
              {busy ? "Redirection..." : "Je recois mon ebook maintenant"}
            </Button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { icon: "🔒", label: "Paiement Stripe" },
                { icon: "📩", label: "Envoi immédiat" },
                { icon: "↩️", label: "Remboursé 14j" },
                { icon: "✉️", label: "Support direct" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-3 text-center"
                >
                  <span aria-hidden className="text-lg leading-none">
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium leading-tight text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Une question ? Écris-nous à{" "}
              <a href="mailto:suzy40713@gmail.com" className="font-semibold text-indigo-600">
                suzy40713@gmail.com
              </a>
              , on répond personnellement.
            </p>
          </motion.div>
        </div>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-slate-900">
            Pourquoi la plupart des transformations physiques echouent
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {RAISONS_ECHEC.map((r, i) => (
              <motion.div
                key={r.titre}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5"
              >
                <h3 className="font-semibold text-slate-900">{r.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.texte}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-slate-900">Ce que tu vas recevoir</h2>
          <ul className="mt-6 flex flex-col gap-3">
            {CONTENU.map((c, i) => (
              <motion.li
                key={c}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex gap-3 text-slate-700"
              >
                <span aria-hidden className="mt-0.5 text-pink-600">
                  ✓
                </span>
                <span className="leading-relaxed">{c}</span>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="relative mt-16 overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 text-white sm:px-10"
        >
          <div className="bg-gradient-kadence pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full opacity-20 blur-3xl" />
          <p className="relative text-lg italic leading-relaxed text-slate-200">
            "On a ecrit ce livre comme on aurait aime en recevoir un le premier jour : sans detour, sans te
            vendre du reve, juste un plan clair qui tient la route sur 90 jours."
          </p>
          <p className="relative mt-4 text-sm font-semibold text-slate-400">— L'equipe Cadenzo</p>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-slate-900">Questions fréquentes</h2>
          <div className="mt-6 flex flex-col gap-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200 px-5 py-4 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-900">
                  {item.q}
                  <span aria-hidden className="text-slate-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.r}</p>
              </details>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-slate-900">Prete a commencer ?</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            Le prochain lot de 90 jours va passer, que tu commences ou non. Autant que ce soit ceux qui te font
            changer.
          </p>
          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-lg text-slate-400 line-through">{compareAtPrice}</span>
            <span className="text-gradient-kadence text-3xl font-extrabold">{price}</span>
          </div>
          <Button disabled={busy || !status?.configured} onClick={handleBuy} className="mt-5">
            {busy ? "Redirection..." : "Je recois mon ebook maintenant"}
          </Button>
        </motion.section>
      </main>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={showStickyBar ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:hidden"
      >
        <div>
          <p className="text-xs text-slate-500">Transformation 90 Jours</p>
          <p className="text-gradient-kadence text-lg font-extrabold">{price}</p>
        </div>
        <Button disabled={busy || !status?.configured} onClick={handleBuy} className="shrink-0">
          {busy ? "..." : "Acheter"}
        </Button>
      </motion.div>
    </div>
  );
}
