import { useEffect, useState } from "react";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushSubscriptionState,
  isPushSupported,
} from "../../lib/push";
import { Button } from "../../components/ui/Button";

export function PushAlertToggle() {
  const [state, setState] = useState<"loading" | "unsupported" | "subscribed" | "unsubscribed">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPushSubscriptionState().then(setState);
  }, []);

  if (!isPushSupported() || state === "unsupported") return null;
  if (state === "loading") return null;

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
