import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ActivityDTO, Sport, WeeklyVolumePoint } from "@sports-coach/shared";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { StravaConnect } from "./StravaConnect";

function formatDuree(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

function formatDistance(metres: number): string {
  return `${(metres / 1000).toFixed(1)} km`;
}

function formatAllure(secPerKm: number | null): string {
  if (!secPerKm) return "-";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

const SPORT_LABEL: Record<Sport, string> = {
  course_a_pied: "Course a pied",
  velo: "Velo",
};

export function DashboardPage() {
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolumePoint[]>([]);
  const [sport, setSport] = useState<Sport>("course_a_pied");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    const [act, vol] = await Promise.all([api.getActivities(), api.getWeeklyVolume()]);
    setActivities(act.activities);
    setWeeklyVolume(vol.weeklyVolume);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await api.importActivity(file, sport);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'importer ce fichier");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const chartData = weeklyVolume.map((w) => ({
    week: w.weekStart,
    km: Math.round((w.totalDistance / 1000) * 10) / 10,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Mes seances</h1>
        <div className="flex items-center gap-2">
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value as Sport)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="course_a_pied">Course a pied</option>
            <option value="velo">Velo</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".fit,.gpx,.tcx"
            className="hidden"
            id="activity-file-input"
            onChange={handleFileSelected}
          />
          <Button
            variant="secondary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Import..." : "Importer un fichier"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <StravaConnect onSynced={loadData} />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Volume hebdomadaire</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-400">Importe des seances pour voir ta charge d'entrainement.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={40} />
              <Tooltip formatter={(value: number) => [`${value} km`, "Volume"]} />
              <Bar dataKey="km" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {activities.length === 0 && (
          <p className="text-sm text-slate-400">Aucune seance importee pour le moment.</p>
        )}
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-slate-800">{SPORT_LABEL[activity.sport]}</p>
              <p className="text-xs text-slate-400">{new Date(activity.date).toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="flex gap-4 text-slate-600">
              <span>{formatDistance(activity.distance)}</span>
              <span>{formatDuree(activity.duree)}</span>
              <span>{formatAllure(activity.allureMoyenne)}</span>
              {activity.denivele !== null && <span>{Math.round(activity.denivele)} m D+</span>}
              {activity.fcMoyenne !== null && <span>{activity.fcMoyenne} bpm</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
