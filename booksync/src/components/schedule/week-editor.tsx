"use client";

import { useState } from "react";
import { Copy, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useSave } from "@/components/settings/use-save";
import { validateWeek, WEEKDAYS, type WeeklyHours } from "@/domain/schedule/hours";
import { hhmmToMinutes, minutesToHHMM } from "@/lib/format";

type Result = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Éditeur d'horaires hebdomadaires. Plusieurs plages par jour = pauses entre les plages.
 */
export function WeekEditor({
  initial,
  onSave,
  saveLabel = "Enregistrer les horaires",
}: {
  initial: WeeklyHours;
  onSave: (week: WeeklyHours) => Promise<Result>;
  saveLabel?: string;
}) {
  const [week, setWeek] = useState<WeeklyHours>(() => structuredClone(initial));
  const [error, setError] = useState<string | null>(null);
  const { pending, save } = useSave();

  const update = (day: number, ranges: WeeklyHours[number]) => setWeek((w) => ({ ...w, [day]: ranges }));

  function submit() {
    const err = validateWeek(week);
    if (err) return setError(err.message);
    setError(null);
    save(() => onSave(week));
  }

  return (
    <div className="grid gap-4">
      <ul className="divide-y rounded-lg border">
        {WEEKDAYS.map(({ value, label }) => {
          const ranges = week[value] ?? [];
          const open = ranges.length > 0;
          return (
            <li key={value} className="grid gap-3 px-3 py-3 sm:grid-cols-[150px_1fr] sm:items-start sm:px-4" data-testid={`day-${value}`}>
              <div className="flex items-center justify-between gap-3 sm:h-9">
                <span className="text-sm font-medium">{label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{open ? "Ouvert" : "Fermé"}</span>
                  <Switch
                    checked={open}
                    aria-label={`${label} ouvert`}
                    onCheckedChange={(c) => update(value, c ? [{ startMinute: 540, endMinute: 1080 }] : [])}
                  />
                </span>
              </div>
              {open ? (
                <div className="grid gap-2">
                  {ranges.map((r, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <TimeInput
                        label={`${label} plage ${i + 1} début`}
                        value={r.startMinute}
                        onChange={(m) => update(value, ranges.map((x, j) => (j === i ? { ...x, startMinute: m } : x)))}
                      />
                      <span className="text-muted-foreground">–</span>
                      <TimeInput
                        label={`${label} plage ${i + 1} fin`}
                        value={r.endMinute}
                        onChange={(m) => update(value, ranges.map((x, j) => (j === i ? { ...x, endMinute: m } : x)))}
                      />
                      {ranges.length > 1 ? (
                        <Button type="button" variant="ghost" size="icon" aria-label="Supprimer cette plage" onClick={() => update(value, ranges.filter((_, j) => j !== i))}>
                          <X />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const last = ranges[ranges.length - 1];
                        const start = Math.min(last.endMinute + 60, 1380);
                        update(value, [...ranges, { startMinute: start, endMinute: Math.min(start + 120, 1440) }]);
                      }}
                    >
                      <Plus /> Ajouter une plage (pause)
                    </Button>
                    {value === 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setWeek((w) => {
                            const next = { ...w };
                            for (let d = 2; d <= 5; d++) next[d] = structuredClone(w[1]);
                            return next;
                          })
                        }
                      >
                        <Copy /> Copier sur mar.–ven.
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="button" onClick={submit} disabled={pending} className="sm:justify-self-end">
        {pending ? <Spinner /> : null}
        {saveLabel}
      </Button>
    </div>
  );
}

function TimeInput({ value, onChange, label }: { value: number; onChange: (m: number) => void; label: string }) {
  return (
    <input
      type="time"
      step={300}
      aria-label={label}
      value={minutesToHHMM(Math.min(value, 1439))}
      onChange={(e) => {
        const m = hhmmToMinutes(e.target.value);
        if (m !== null) onChange(m === 0 && value > 720 ? 1440 : m);
      }}
      className="h-10 w-[7.5rem] rounded-md border border-input bg-card px-3 text-base tabular-nums shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 sm:h-9 sm:text-sm"
    />
  );
}
