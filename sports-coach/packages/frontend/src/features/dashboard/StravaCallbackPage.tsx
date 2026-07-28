import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api, ApiError } from "../../lib/api";

export function StravaCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setError("Connexion Strava annulee.");
      return;
    }
    if (!code) {
      setError("Code d'autorisation manquant dans la reponse de Strava.");
      return;
    }

    api
      .submitStravaCode(code)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Connexion Strava impossible"));
  }, [navigate]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      {error ? (
        <>
          <p className="text-sm text-red-600">{error}</p>
          <a href="/dashboard" className="text-sm text-indigo-600 underline">
            Retour au tableau de bord
          </a>
        </>
      ) : (
        <p className="text-sm text-slate-500">Connexion a Strava en cours...</p>
      )}
    </div>
  );
}
