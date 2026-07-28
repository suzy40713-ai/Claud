import { useEffect, useState } from "react";
import { useLocation } from "react-router";
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
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">Abonnement</h1>

      {checkoutParam === "succes" && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Paiement recu, merci ! L'activation peut prendre quelques secondes.
        </p>
      )}
      {checkoutParam === "annule" && (
        <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">Paiement annule.</p>
      )}

      {!status.configured && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          L'abonnement premium n'est pas encore configure sur ce serveur (cles Stripe manquantes).
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-medium">Gratuit</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-slate-600">
            {FREE_FEATURES.map((f) => (
              <li key={f}>- {f}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <h2 className="font-medium text-indigo-700">Premium</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-slate-700">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f}>- {f}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        {status.premium ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-emerald-700">
              Abonnement premium actif
              {status.currentPeriodEnd &&
                ` jusqu'au ${new Date(status.currentPeriodEnd).toLocaleDateString("fr-FR")}`}
              .
            </p>
            <Button disabled={busy || !status.configured} onClick={handleManage} className="w-fit">
              Gerer mon abonnement
            </Button>
          </div>
        ) : (
          <Button disabled={busy || !status.configured} onClick={handleUpgrade} className="w-fit">
            Passer premium
          </Button>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
