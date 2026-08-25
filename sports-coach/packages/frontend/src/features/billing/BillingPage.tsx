import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import type { BillingStatusDTO } from "@sports-coach/shared";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";

const FREE_FEATURES = [
  "Onboarding et journal quotidien",
  "Dashboard des seances + import manuel (.fit, .gpx, .tcx)",
  "Plan d'entrainement genere chaque semaine",
  "Indicateur de charge (ACWR) visible dans l'app",
];

const PREMIUM_FEATURES = [
  "Coach IA conversationnel illimite",
  "🛒 Liste de courses generee par IA, adaptee a ton objectif",
  "📸 Scanner un plat et connaitre ses calories et macros instantanement",
  "Import automatique des seances depuis Strava",
  "Alertes push proactives en cas de risque de surcharge",
];

export function BillingPage() {
  const location = useLocation();
  const [status, setStatus] = useState<BillingStatusDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutParam = new URLSearchParams(location.search).get("checkout");

  useEffect(() => {
    api.getBillingStatus().then(setStatus);
  }, []);

  async function handleUpgrade() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de demarrer le paiement");
      setBusy(false);
    }
  }

  async function handleManage() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.createPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ouvrir la gestion de l'abonnement");
      setBusy(false);
    }
  }

  if (!status) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-pink-600">Cadenzo Premium</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Va plus loin dans ton entrainement</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-500">
          Un coach qui te repond a toute heure, une synchronisation qui ne t'oublie jamais, et des alertes avant que
          la blessure n'arrive.
        </p>
      </motion.div>

      {checkoutParam === "succes" && (
        <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
          Paiement recu, merci ! L'activation peut prendre quelques secondes.
        </p>
      )}
      {checkoutParam === "annule" && (
        <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">Paiement annule.</p>
      )}
      {!status.configured && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
          L'abonnement premium n'est pas encore configure sur ce serveur (cles Stripe manquantes).
        </p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">Gratuit</h2>
          <p className="mt-1 text-sm text-slate-500">Pour demarrer serieusement</p>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm text-slate-600">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span aria-hidden className="text-slate-400">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative flex flex-col overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/25"
        >
          <div className="bg-gradient-kadence pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl" />
          <span className="absolute right-5 top-5 rounded-full bg-gradient-kadence px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            Recommande
          </span>
          <h2 className="relative text-lg font-bold">👑 Premium</h2>
          <p className="relative mt-1 text-sm text-slate-300">Le plein potentiel de ton coach</p>
          <ul className="relative mt-5 flex flex-1 flex-col gap-2.5 text-sm text-slate-100">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span aria-hidden className="text-pink-400">
                  ✦
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="relative mt-6">
            {status.premium ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-emerald-400">
                  Abonnement actif
                  {status.currentPeriodEnd &&
                    ` jusqu'au ${new Date(status.currentPeriodEnd).toLocaleDateString("fr-FR")}`}
                  .
                </p>
                <Button
                  variant="secondary"
                  disabled={busy || !status.configured}
                  onClick={handleManage}
                  className="w-full"
                >
                  Gerer mon abonnement
                </Button>
              </div>
            ) : (
              <Button
                disabled={busy || !status.configured}
                onClick={handleUpgrade}
                className="animate-pulse-glow w-full bg-gradient-kadence"
              >
                {busy ? "Redirection..." : "Passer premium"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {!status.premium && (
        <Link
          to="/pack-complet"
          className="mx-auto mt-8 flex max-w-md items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-xl">
              🎁
            </span>
            <span className="text-sm font-semibold text-slate-900">
              Ou prends le Pack Complet : tous les ebooks + 1 an Premium en un seul achat
            </span>
          </span>
          <span aria-hidden className="text-indigo-600">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
