import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

const CONTENU = [
  "Les 6 ebooks Cadenzo : Transformation 90 Jours, Recettes Régime, Recettes Prise de Masse, Bases de la Musculation, Cardio & Renfo Sans Matériel, Dors Mieux Progresse Plus Vite",
  "1 an d'abonnement Premium sur l'app : Coach IA illimité, scan de plats par IA, liste de courses générée par IA, import automatique Strava, alertes proactives",
  "Tout envoyé et activé automatiquement après paiement, aucune attente",
];

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function BundlePage() {
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<{ configured: boolean; priceCents: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutParam = new URLSearchParams(location.search).get("checkout");

  useEffect(() => {
    if (user) {
      api.getBundleStatus().then(setStatus);
    }
  }, [user]);

  async function handleBuy() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.createBundleCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de demarrer le paiement");
      setBusy(false);
    }
  }

  const price = status ? formatPrice(status.priceCents) : "100,00 €";

  return (
    <div className="min-h-screen bg-white">
      <header className="glass-card sticky top-0 z-20 px-4 py-4">
        <Link to={user ? "/" : "/login"} className="text-lg font-extrabold tracking-tight text-slate-900">
          👑 Cadenzo
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {checkoutParam === "succes" && (
          <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Paiement recu, merci ! Tes ebooks partent vers ta boite mail dans quelques instants, et ton compte passe
            Premium sous quelques secondes.
          </p>
        )}
        {checkoutParam === "annule" && (
          <p className="mb-6 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            Paiement annule. Tu peux reessayer quand tu veux.
          </p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-10 text-center text-white sm:px-10"
        >
          <div className="bg-gradient-kadence pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-30 blur-3xl" />
          <span aria-hidden className="relative text-4xl">
            🎁
          </span>
          <p className="relative mt-3 text-xs font-bold uppercase tracking-widest text-pink-300">
            Offre la plus complète
          </p>
          <h1 className="relative mt-2 text-3xl font-extrabold leading-tight">Pack Complet Cadenzo</h1>
          <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            Tous les ebooks, plus un an de Premium sur l'app, en un seul achat.
          </p>
          <div className="relative mt-6 flex items-baseline justify-center gap-3">
            <span className="text-gradient-kadence text-3xl font-extrabold">{price}</span>
          </div>

          {!user ? (
            <div className="relative mt-5 flex flex-col items-center gap-2">
              <p className="text-sm text-slate-300">Connecte-toi pour acheter le Pack Complet.</p>
              <div className="flex gap-2">
                <Link to="/login">
                  <Button variant="secondary">Se connecter</Button>
                </Link>
                <Link to="/register">
                  <Button>Créer un compte</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Button disabled={busy || !status?.configured} onClick={handleBuy} className="relative mt-5">
                {busy ? "Redirection..." : "Je débloque tout maintenant"}
              </Button>
              {status && !status.configured && (
                <p className="relative mt-2 text-sm text-amber-300">
                  Le Pack Complet n'est pas encore configuré sur ce serveur.
                </p>
              )}
            </>
          )}
          {error && <p className="relative mt-2 text-sm text-red-300">{error}</p>}
        </motion.div>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <h2 className="text-xl font-bold text-slate-900">Ce que tu débloques</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {CONTENU.map((c) => (
              <li key={c} className="flex gap-3 text-sm text-slate-700">
                <span aria-hidden className="mt-0.5 text-pink-600">
                  ✓
                </span>
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        <p className="mt-8 text-center text-sm text-slate-500">
          Une question ? Écris-nous à{" "}
          <a href="mailto:suzy40713@gmail.com" className="font-semibold text-indigo-600">
            suzy40713@gmail.com
          </a>
        </p>
      </main>
    </div>
  );
}
