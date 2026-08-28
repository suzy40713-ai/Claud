import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { DailyLogDTO } from "@sports-coach/shared";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { ScaleSelector } from "../../components/ui/ScaleSelector";
import { EbookPromoBanner } from "../../components/ui/PromoBanner";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyLogPage() {
  const [sommeil, setSommeil] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [history, setHistory] = useState<DailyLogDTO[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getTodayLog(), api.getDailyLogs(7)])
      .then(([today, past]) => {
        if (today.log) {
          setSommeil(today.log.sommeil);
          setFatigue(today.log.fatigue);
          setStress(today.log.stress);
          setSaved(true);
        }
        setHistory(past.logs);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (sommeil === null || fatigue === null || stress === null) return;
    setError(null);
    setSubmitting(true);
    try {
      const { log } = await api.saveDailyLog({ date: todayIso(), sommeil, fatigue, stress });
      setSaved(true);
      setHistory((prev) => [log, ...prev.filter((l) => l.date !== log.date)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = sommeil !== null && fatigue !== null && stress !== null;

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-8"
    >
      <div>
        <h1 className="text-2xl font-bold">📓 Journal du jour</h1>
        <p className="text-base text-slate-500">Trois questions, 15 secondes.</p>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <ScaleSelector
          icon="😴"
          label="Qualite du sommeil"
          value={sommeil}
          onChange={setSommeil}
          lowLabel="Tres mauvais"
          highLabel="Excellent"
        />
        <ScaleSelector
          icon="🔋"
          label="Niveau de fatigue"
          value={fatigue}
          onChange={setFatigue}
          lowLabel="Pas fatigue"
          highLabel="Epuise"
        />
        <ScaleSelector
          icon="😌"
          label="Stress percu"
          value={stress}
          onChange={setStress}
          lowLabel="Zen"
          highLabel="Tres stresse"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-emerald-600">Journal enregistre pour aujourd'hui.</p>}

        <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Enregistrement..." : saved ? "Mettre a jour" : "Valider"}
        </Button>
      </div>

      <EbookPromoBanner />

      {history.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-700">7 derniers jours</h2>
          <div className="flex flex-col gap-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className="text-slate-500">{log.date}</span>
                <span className="flex gap-4 text-slate-700">
                  <span>😴 {log.sommeil}/5</span>
                  <span>🔋 {log.fatigue}/5</span>
                  <span>😌 {log.stress}/5</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
