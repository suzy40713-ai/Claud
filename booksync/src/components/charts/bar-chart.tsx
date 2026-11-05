"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Histogramme à une série (couleur principale), barres fines à extrémité arrondie,
 * grille discrète, infobulle au survol et tableau de données accessible.
 */
export function SimpleBarChart({
  data,
  valueLabel,
  format = (v) => String(v),
  height = 220,
  caption,
}: {
  data: { label: string; value: number; tooltipLabel?: string }[];
  valueLabel: string;
  format?: (v: number) => string;
  height?: number;
  caption: string;
}) {
  return (
    <figure>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
            barCategoryGap={2}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              width={48}
              tickFormatter={(v: number) => format(v)}
            />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as {
                  label: string;
                  value: number;
                  tooltipLabel?: string;
                };
                return (
                  <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">{p.tooltipLabel ?? p.label}</p>
                    <p className="text-muted-foreground">
                      {valueLabel} :{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {format(p.value)}
                      </span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Voir les données</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t">
                <td className="py-1">{d.tooltipLabel ?? d.label}</td>
                <td className="py-1 text-right text-foreground tabular-nums">{format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Classement horizontal (barres + libellés directs), sans graphique lourd. */
export function RankBars({
  rows,
  format = (v) => String(v),
}: {
  rows: { label: string; value: number; sub?: string }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-3">
      {rows.map((r) => (
        <li key={r.label} className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {format(r.value)}
              {r.sub ? (
                <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">
                  {r.sub}
                </span>
              ) : null}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
