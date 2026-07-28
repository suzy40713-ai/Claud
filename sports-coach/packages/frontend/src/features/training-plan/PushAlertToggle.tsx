import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushSubscriptionState,
  isPushSupported,
} from "../../lib/push";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/Button";

export function PushAlertToggle() {
  const [state, setState] = useState<"loading" | "unsupported" | "subscribed" | "unsubscribed">("loading");
  const [premium, setPremium] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPushSubscriptionState().then(setState);
    api.getBillingStatus().then((s) => setPremium(s.premium));
  }, []);

  if (!isPushSupported() || state === "unsupported") return null;
  if (state === "loading" || premium === null) return null;

  if (!premium) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-sm">
        <span className="text-slate-600">Recevoir une alerte si ta charge devient risquee (fonctionnalite premium)</span>
        <Link to="/abonnement">
          <Button variant="secondary">Passer premium</Button>
        </Link>
      </div>
    );
  }

  async function handleToggle() {
    setBusy(true);
    setError(null);
    try {
      if (state === "subscribed") {
        await disablePushNotifications();
        setState("unsubscribed");
      } else {
        await enablePushNotifications();
        setState("subscribed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <span className="text-slate-600">
        {state === "subscribed" ? "Alertes de surcharge activees" : "Recevoir une alerte si ta charge devient risquee"}
      </span>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <Button variant={state === "subscribed" ? "secondary" : "primary"} disabled={busy} onClick={handleToggle}>
          {state === "subscribed" ? "Desactiver" : "Activer"}
        </Button>
      </div>
    </div>
  );
}
