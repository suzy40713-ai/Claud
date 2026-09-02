import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthEntry } from "../lib/storage";
import { formatEuros } from "../lib/rates";

const MOIS_LABELS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];

export function HistoryChart({ entries, year }: { entries: MonthEntry[]; year: number }) {
  const data = MOIS_LABELS.map((label, i) => {
    const month = `${year}-${String(i + 1).padStart(2, "0")}`;
    const entry = entries.find((e) => e.month === month);
    return { label, ca: entry?.chiffreAffaires ?? 0 };
  });

  const hasData = data.some((d) => d.ca > 0);

  if (!hasData) {
    return <p className="mt-4 text-sm text-slate-400">Enregistre ton premier mois pour voir apparaitre ton historique ici.</p>;
  }

  return (
    <div className="mt-4 h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(value) => formatEuros(Number(value) || 0)}
            cursor={{ fill: "rgba(13,148,136,0.06)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Bar dataKey="ca" fill="#0d9488" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
