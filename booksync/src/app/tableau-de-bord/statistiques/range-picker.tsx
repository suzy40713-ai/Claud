"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const shift = (d: string, n: number) => {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10);
};

export function RangePicker({ from, to, today }: { from: string; to: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const presets = [
    { label: "7 jours", from: shift(today, -6), to: today },
    { label: "30 jours", from: shift(today, -29), to: today },
    { label: "Ce mois", from: `${today.slice(0, 8)}01`, to: today },
    { label: "12 mois", from: shift(today, -364), to: today },
  ];
  const go = (a: string, b: string) => router.push(`${pathname}?du=${a}&au=${b}` as Route);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => go(p.from, p.to)}
            className={cn("h-8 rounded-md border px-3 text-sm font-medium", p.from === from && p.to === to ? "border-primary bg-primary-soft text-primary-soft-foreground" : "bg-card text-muted-foreground hover:text-foreground")}
          >
            {p.label}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-2 sm:ml-auto"
        onSubmit={(e) => {
          e.preventDefault();
          go(f, t);
        }}
      >
        <Input type="date" aria-label="Du" value={f} max={today} onChange={(e) => setF(e.target.value)} className="h-9 w-[9.5rem]" />
        <span className="text-muted-foreground">→</span>
        <Input type="date" aria-label="Au" value={t} max={today} onChange={(e) => setT(e.target.value)} className="h-9 w-[9.5rem]" />
        <Button type="submit" variant="secondary" size="sm">
          Appliquer
        </Button>
      </form>
    </div>
  );
}
