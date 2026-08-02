import { useEffect, useState } from "react";
import type { AcwrDTO, PlannedSessionDTO, Sport, TrainingPlanDTO } from "@sports-coach/shared";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { PushAlertToggle } from "./PushAlertToggle";

const TYPE_LABELS: Record<PlannedSessionDTO["type"], string> = {
  endurance_fondamentale: "Endurance fondamentale",
  fractionne: "Fractionne",
  seuil: "Seuil",
  sortie_longue: "Sortie longue",
  recuperation: "Recuperation",
};

const INTENSITE_LABELS: Record<PlannedSessionDTO["intensiteCible"], string> = {
  faible: "Intensite faible",
  moderee: "Intensite moderee",
  elevee: "Intensite elevee",
};

const SPORT_LABELS: Record<Sport, string> = {
  course_a_pied: "Course a pied",
  velo: "Velo",
};

const ACWR_STYLES: Record<AcwrDTO["niveauRisque"], string> = {
  donnees_insuffisantes: "border-slate-200 bg-slate-50 text-slate-600",
  sous_charge: "border-sky-200 bg-sky-50 text-sky-800",
  optimal: "border-emerald-200 bg-emerald-50 text-emerald-800",
  modere: "border-amber-200 bg-amber-50 text-amber-800",
  eleve: "border-red-200 bg-red-50 text-red-800",
};

const ACWR_TITLES: Record<AcwrDTO["niveauRisque"], string> = {
  donnees_insuffisantes: "Pas encore assez de donnees",
  sous_charge: "Charge en dessous de la normale",
  optimal: "Charge d'entrainement optimale",
  modere: "Augmentation de charge a surveiller",
  eleve: "Risque de surcharge eleve",
};

const ACWR_ICONS: Record<AcwrDTO["niveauRisque"], string> = {
  donnees_insuffisantes: "📊",
  sous_charge: "💤",
  optimal: "✅",
  modere: "⚠️",
  eleve: "🔥",
};

function formatDuree(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
}

export function TrainingPlanPage() {
  const [plan, setPlan] = useState<TrainingPlanDTO | null>(null);
  const [acwr, setAcwr] = useState<AcwrDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [busySessionId, setBusySessionId] = useState<string | null>(null);

  useEffect(() => {
    api
      .getTrainingPlan()
      .then(({ plan, acwr }) => {
        setPlan(plan);
        setAcwr(acwr);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger le plan"))
      .finally(() => setLoading(false));
  }, []);

  function replaceSeance(updated: PlannedSessionDTO) {
    setPlan((prev) =>
      prev ? { ...prev, seances: prev.seances.map((s) => (s.id === updated.id ? updated : s)) } : prev
    );
  }

  async function handleStatutChange(sessionId: string, statut: "fait" | "skip") {
    setBusySessionId(sessionId);
    try {
      const { seance } = await api.updateSessionStatut(sessionId, statut);
      replaceSeance(seance);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de mettre a jour la seance");
    } finally {
      setBusySessionId(null);
    }
  }

  async function handleAcceptSuggestion(sessionId: string) {
    setBusySessionId(sessionId);
    try {
      const { seance } = await api.applySuggestion(sessionId);
      replaceSeance(seance);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'appliquer la suggestion");
    } finally {
      setBusySessionId(null);
    }
  }

  if (loading) return null;

  if (error && !plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">📅 Mon plan de la semaine</h1>
        <p className="text-sm text-slate-400">Genere selon ton objectif et ton niveau. Chaque ajustement reste ton choix.</p>
      </div>

      {acwr && (
        <div className={`rounded-2xl border p-5 shadow-sm ${ACWR_STYLES[acwr.niveauRisque]}`}>
          <p className="flex items-center gap-2 text-base font-semibold">
            <span aria-hidden>{ACWR_ICONS[acwr.niveauRisque]}</span>
            {ACWR_TITLES[acwr.niveauRisque]}
          </p>
          <p className="mt-1 text-sm">{acwr.explication}</p>
        </div>
      )}

      <PushAlertToggle />

      {error && plan && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        {plan?.seances.map((seance) => {
          const suggestion = dismissedSuggestions.has(seance.id) ? null : seance.suggestion;
          const busy = busySessionId === seance.id;

          return (
            <div key={seance.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{formatDate(seance.date)}</p>
                  <p className="text-base font-semibold text-slate-800">
                    {TYPE_LABELS[seance.type]} - {SPORT_LABELS[seance.sport]}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDuree(seance.dureeCible)} - {INTENSITE_LABELS[seance.intensiteCible]}
                  </p>
                  {seance.raisonAjustement && (
                    <p className="mt-1 text-xs text-indigo-600">Ajuste : {seance.raisonAjustement}</p>
                  )}
                </div>

                {seance.statut === "a_faire" || seance.statut === "ajuste" ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={busy} onClick={() => handleStatutChange(seance.id, "skip")}>
                      Passer
                    </Button>
                    <Button disabled={busy} onClick={() => handleStatutChange(seance.id, "fait")}>
                      Fait
                    </Button>
                  </div>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {seance.statut === "fait" ? "Terminee" : "Passee"}
                  </span>
                )}
              </div>

              {suggestion && (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <p className="text-sm text-indigo-900">{suggestion.raison}</p>
                  <p className="mt-1 text-xs text-indigo-700">
                    Proposition : {formatDuree(suggestion.dureeCibleProposee)} - {INTENSITE_LABELS[suggestion.intensiteCibleProposee]}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setDismissedSuggestions((prev) => new Set(prev).add(seance.id))}
                    >
                      Ignorer
                    </Button>
                    <Button disabled={busy} onClick={() => handleAcceptSuggestion(seance.id)}>
                      Accepter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
