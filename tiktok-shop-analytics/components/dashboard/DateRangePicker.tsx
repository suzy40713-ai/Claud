"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { PRESETS, type PresetKey } from "@/lib/margin/date-range";
import type { DateRange } from "@/lib/margin/types";

export function DateRangePicker({
  activePreset,
  range,
}: {
  activePreset: PresetKey;
  range: DateRange;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);

  function navigate(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("from");
    next.delete("to");
    next.delete("preset");
    for (const [key, value] of Object.entries(params)) {
      next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.key}
          onClick={() => navigate({ preset: preset.key })}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activePreset === preset.key
              ? "bg-neutral-900 text-white"
              : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {preset.label}
        </button>
      ))}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
        <span className="text-neutral-400">→</span>
        <input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
        <button
          onClick={() => navigate({ from: customFrom, to: customTo })}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activePreset === "custom"
              ? "bg-neutral-900 text-white"
              : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          Appliquer
        </button>
      </div>
    </div>
  );
}
