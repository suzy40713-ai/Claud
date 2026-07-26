"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MarginTimePoint } from "@/lib/margin/types";

export function MarginChart({ data }: { data: MarginTimePoint[] }) {
  return (
    <div className="h-72 w-full rounded-lg border border-neutral-200 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: "#737373" }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 12, fill: "#737373" }}
            width={80}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              name === "netMargin" ? "Marge nette" : "Chiffre d'affaires",
            ]}
          />
          <Line
            type="monotone"
            dataKey="netMargin"
            stroke="#171717"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#a3a3a3"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
