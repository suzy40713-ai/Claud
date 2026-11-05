"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { formatInTz } from "@/lib/format";

type Result =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
type Absence = { id: string; startsAt: string; endsAt: string; reason: string | null };

export function TimeOffManager({
  items,
  timeZone,
  emptyLabel,
  addLabel,
  onAdd,
  onRemove,
}: {
  items: Absence[];
  timeZone: string;
  emptyLabel: string;
  addLabel: string;
  onAdd: (input: {
    startDate: string;
    endDate: string;
    allDay: boolean;
    startTime?: string;
    endTime?: string;
    reason: string;
  }) => Promise<Result>;
  onRemove: (id: string) => Promise<Result>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [allDay, setAllDay] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function describe(a: Absence) {
    const s = new Date(a.startsAt);
    const e = new Date(new Date(a.endsAt).getTime() - 1);
    const sameDay = formatInTz(s, timeZone, "yyyy-MM-dd") === formatInTz(e, timeZone, "yyyy-MM-dd");
    const isAllDay =
      formatInTz(s, timeZone, "HH:mm") === "00:00" &&
      formatInTz(a.endsAt, timeZone, "HH:mm") === "00:00";
    if (isAllDay) {
      return sameDay
        ? formatInTz(s, timeZone, "EEEE d MMMM yyyy")
        : `Du ${formatInTz(s, timeZone, "d MMM")} au ${formatInTz(e, timeZone, "d MMM yyyy")}`;
    }
    return sameDay
      ? `${formatInTz(s, timeZone, "EEEE d MMMM")}, ${formatInTz(s, timeZone, "HH:mm")}–${formatInTz(a.endsAt, timeZone, "HH:mm")}`
      : `Du ${formatInTz(s, timeZone, "d MMM HH:mm")} au ${formatInTz(a.endsAt, timeZone, "d MMM HH:mm")}`;
  }

  return (
    <div className="grid gap-4">
      {items.length ? (
        <ul className="divide-y rounded-lg border">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
              data-testid="time-off-row"
            >
              <CalendarOff className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium first-letter:uppercase">{describe(a)}</p>
                {a.reason ? (
                  <p className="truncate text-[13px] text-muted-foreground">{a.reason}</p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Supprimer"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await onRemove(a.id);
                    if (res.ok) toast.success("Supprimé.");
                    else toast.error(res.error);
                    router.refresh();
                  })
                }
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="sm:justify-self-start">
            <Plus /> {addLabel}
          </Button>
        </DialogTrigger>
        <DialogContent
          title={addLabel}
          description="Aucun créneau ne sera proposé pendant cette période."
        >
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const input = {
                startDate: String(fd.get("startDate")),
                endDate: String(fd.get("endDate") || fd.get("startDate")),
                allDay,
                startTime: allDay ? undefined : String(fd.get("startTime")),
                endTime: allDay ? undefined : String(fd.get("endTime")),
                reason: String(fd.get("reason") ?? ""),
              };
              startTransition(async () => {
                const res = await onAdd(input);
                if (!res.ok) {
                  setErrors(res.fieldErrors ?? { form: res.error });
                  toast.error(res.error);
                  return;
                }
                setErrors({});
                toast.success(res.message ?? "Enregistré.");
                setOpen(false);
                router.refresh();
              });
            }}
          >
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              Journée entière
              <Switch checked={allDay} onCheckedChange={setAllDay} aria-label="Journée entière" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="startDate" label="Du" error={errors.startDate}>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  min={today}
                  defaultValue={today}
                  required
                />
              </Field>
              <Field id="endDate" label="Au" error={errors.endDate}>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  min={today}
                  defaultValue={today}
                  required
                />
              </Field>
              {!allDay ? (
                <>
                  <Field id="startTime" label="De" error={errors.startTime}>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      defaultValue="12:00"
                      required
                    />
                  </Field>
                  <Field id="endTime" label="À" error={errors.endTime}>
                    <Input id="endTime" name="endTime" type="time" defaultValue="14:00" required />
                  </Field>
                </>
              ) : null}
            </div>
            <Field id="reason" label="Motif (facultatif)" error={errors.reason}>
              <Input
                id="reason"
                name="reason"
                placeholder="Congés, formation, jour férié…"
                maxLength={120}
              />
            </Field>
            {errors.form ? <p className="text-sm text-destructive">{errors.form}</p> : null}
            <Button type="submit" size="lg" disabled={pending} className="w-full">
              {pending ? <Spinner /> : null}
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
