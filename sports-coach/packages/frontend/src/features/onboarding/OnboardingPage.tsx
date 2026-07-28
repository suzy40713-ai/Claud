import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Niveau, Objectif, Sport } from "@sports-coach/shared";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";

interface InjuryDraft {
  zone: string;
  type: string;
  notes: string;
}

const SPORT_OPTIONS: { value: Sport; label: string }[] = [
  { value: "course_a_pied", label: "Course a pied" },
  { value: "velo", label: "Velo" },
];

const NIVEAU_OPTIONS: { value: Niveau; label: string }[] = [
  { value: "debutant", label: "Debutant" },
  { value: "intermediaire", label: "Intermediaire" },
  { value: "avance", label: "Avance" },
];

const OBJECTIF_OPTIONS: { value: Objectif; label: string }[] = [
  { value: "perte_de_poids", label: "Perte de poids" },
  { value: "preparation_course", label: "Preparation d'une course" },
  { value: "regularite", label: "Regularite / reprise en douceur" },
  { value: "performance", label: "Performance / battre mon record" },
];

const TOTAL_STEPS = 4;
const DRAFT_KEY = "sports-coach:onboarding-draft";

interface OnboardingDraft {
  step: number;
  sports: Sport[];
  niveau: Niveau | null;
  objectif: Objectif | null;
  injuries: InjuryDraft[];
}

function loadDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : null;
  } catch {
    return null;
  }
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const draft = loadDraft();
  const [step, setStep] = useState(draft?.step ?? 1);
  const [sports, setSports] = useState<Sport[]>(draft?.sports ?? []);
  const [niveau, setNiveau] = useState<Niveau | null>(draft?.niveau ?? null);
  const [objectif, setObjectif] = useState<Objectif | null>(draft?.objectif ?? null);
  const [injuries, setInjuries] = useState<InjuryDraft[]>(draft?.injuries ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, sports, niveau, objectif, injuries }));
  }, [step, sports, niveau, objectif, injuries]);

  function toggleSport(sport: Sport) {
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));
  }

  function addInjury() {
    setInjuries((prev) => [...prev, { zone: "", type: "", notes: "" }]);
  }

  function updateInjury(index: number, patch: Partial<InjuryDraft>) {
    setInjuries((prev) => prev.map((injury, i) => (i === index ? { ...injury, ...patch } : injury)));
  }

  function removeInjury(index: number) {
    setInjuries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFinish() {
    if (!niveau || !objectif) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.submitOnboarding({
        sportsPratiques: sports,
        niveau,
        objectif,
        injuries: injuries
          .filter((i) => i.zone.trim() && i.type.trim())
          .map((i) => ({ zone: i.zone, type: i.type, notes: i.notes || null })),
      });
      await refreshUser();
      localStorage.removeItem(DRAFT_KEY);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ton profil");
    } finally {
      setSubmitting(false);
    }
  }

  const canGoNext =
    (step === 1 && sports.length > 0) ||
    (step === 2 && niveau !== null) ||
    (step === 3 && objectif !== null) ||
    step === 4;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-indigo-600" : "bg-slate-200"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Quel(s) sport(s) pratiques-tu ?</h1>
          <div className="flex flex-col gap-3">
            {SPORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                  sports.includes(opt.value) ? "border-indigo-600 bg-indigo-50" : "border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sports.includes(opt.value)}
                  onChange={() => toggleSport(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Quel est ton niveau ?</h1>
          <div className="flex flex-col gap-3">
            {NIVEAU_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                  niveau === opt.value ? "border-indigo-600 bg-indigo-50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="niveau"
                  checked={niveau === opt.value}
                  onChange={() => setNiveau(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Quel est ton objectif principal ?</h1>
          <div className="flex flex-col gap-3">
            {OBJECTIF_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                  objectif === opt.value ? "border-indigo-600 bg-indigo-50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="objectif"
                  checked={objectif === opt.value}
                  onChange={() => setObjectif(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">As-tu deja eu des blessures ?</h1>
          <p className="text-sm text-slate-500">
            Facultatif. Ceci ne remplace pas un avis medical, mais nous aide a adapter les charges
            d'entrainement.
          </p>
          <div className="flex flex-col gap-4">
            {injuries.map((injury, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  placeholder="Zone (ex: genou droit)"
                  value={injury.zone}
                  onChange={(e) => updateInjury(i, { zone: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <input
                  placeholder="Type (ex: tendinite)"
                  value={injury.type}
                  onChange={(e) => updateInjury(i, { type: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <textarea
                  placeholder="Notes (optionnel)"
                  value={injury.notes}
                  onChange={(e) => updateInjury(i, { notes: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => removeInjury(i)}
                  className="self-start text-sm text-red-600"
                >
                  Supprimer
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addInjury}>
              + Ajouter une blessure passee
            </Button>
          </div>
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-auto flex justify-between gap-3">
        {step > 1 && (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Retour
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button className="ml-auto" disabled={!canGoNext} onClick={() => setStep((s) => s + 1)}>
            Suivant
          </Button>
        ) : (
          <Button className="ml-auto" disabled={submitting} onClick={handleFinish}>
            {submitting ? "Enregistrement..." : "Terminer"}
          </Button>
        )}
      </div>
    </div>
  );
}
