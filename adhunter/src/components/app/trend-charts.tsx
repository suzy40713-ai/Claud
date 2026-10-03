"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Validated with the dataviz palette checker against the #171A21 surface (dark).
const SERIES = { searches: "#9179FF", ads: "#33A596" };
const AXIS = { stroke: "hsl(220 9% 62%)", fontSize: 12 };
const GRID = "hsl(222 14% 18%)";

const tooltipStyle = {
  contentStyle: { background: "#171A21", border: "1px solid hsl(222 14% 22%)", borderRadius: 10, fontSize: 12, color: "#F4F5F8" },
  labelStyle: { color: "#F4F5F8", marginBottom: 4 },
  itemStyle: { color: "#C9CCD4" },
  cursor: { fill: "rgba(255,255,255,0.04)", stroke: "rgba(255,255,255,0.15)" },
};

function weekLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function WeeklyChart({ data }: { data: { week: string; searches: number; ads: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="week" tickFormatter={weekLabel} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} labelFormatter={(v) => `Semaine du ${weekLabel(String(v))}`} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#C9CCD4" }} iconType="plainline" />
          <Line type="monotone" dataKey="searches" name="Recherches" stroke={SERIES.searches} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "#171A21" }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="ads" name="Publicités observées" stroke={SERIES.ads} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4, strokeWidth: 2, stroke: "#171A21" }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBars({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  return (
    <div className="w-full" style={{ height: Math.max(160, data.length * 40) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={120} tick={{ ...AXIS, fill: "#C9CCD4" }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="value" name={label} fill={SERIES.searches} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
