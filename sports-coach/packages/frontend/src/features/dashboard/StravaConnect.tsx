import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";

export function StravaConnect({ onSynced }: { onSynced?: () => void }) {
  const [status, setStatus] = useState<{
    configured: boolean;
    connected: boolean;
    lastSyncAt: string | null;
    premium: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getStravaStatus().then(setStatus);
  }, []);

  if (!status || !status.configured) return null;

  if (!status.premium) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 text-sm shadow-sm">
        <span className="text-slate-600">Importe automatiquement tes seances depuis Strava (fonctionnalite premium)</span>
        <Link to="/abonnement">
          <Button variant="secondary">Passer premium</Button>
        </Link>
      </div>
    );
  }

  async function handleConnect() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.getStravaAuthorizeUrl();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de se connecter a Strava");
      setBusy(false);
    }
  }

  async function handleSync() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { imported } = await api.syncStrava();
      setMessage(imported > 0 ? `${imported} nouvelle(s) seance(s) importee(s).` : "Deja a jour.");
      const updated = await api.getStravaStatus();
      setStatus(updated);
      onSynced?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Synchronisation impossible");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    setError(null);
    try {
      await api.disconnectStrava();
      setStatus((prev) => (prev ? { ...prev, connected: false, lastSyncAt: null } : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deconnexion impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <div>
        <span className="text-slate-600">
          {status.connected
            ? `Strava connecte${status.lastSyncAt ? ` - derniere synchro le ${new Date(status.lastSyncAt).toLocaleString("fr-FR")}` : ""}`
            : "Importe automatiquement tes seances depuis Strava"}
        </span>
        {message && <p className="text-xs text-emerald-600">{message}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        {status.connected ? (
          <>
            <Button variant="secondary" disabled={busy} onClick={handleDisconnect}>
              Deconnecter
            </Button>
            <Button disabled={busy} onClick={handleSync}>
              Synchroniser
            </Button>
          </>
        ) : (
          <Button disabled={busy} onClick={handleConnect}>
            Connecter Strava
          </Button>
        )}
      </div>
    </div>
  );
}
