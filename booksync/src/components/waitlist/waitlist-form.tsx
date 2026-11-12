"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { TIME_RANGES, WEEKDAY_LABELS, type TimeRange } from "@/domain/waitlist/match";
import { cn } from "@/lib/utils";

export type WaitlistValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceId: string;
  staffId: string | null;
  dateFrom: string;
  dateTo: string;
  weekdays: number[];
  timeRange: TimeRange;
  note: string;
};

type Result =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Formulaire d'inscription sur la liste d'attente (page publique et tableau de bord). */
export function WaitlistForm({
  services,
  staff,
  today,
  maxDate,
  initialServiceId,
  submitLabel,
  onSubmit,
  onDone,
  honeypot,
}: {
  services: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; name: string }>;
  today: string;
  maxDate: string;
  initialServiceId?: string;
  submitLabel: string;
  onSubmit: (values: WaitlistValues & { website?: string }) => Promise<Result>;
  onDone: (message?: string) => void;
  honeypot?: boolean;
}) {
  const [v, setV] = useState<WaitlistValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    serviceId: initialServiceId ?? services[0]?.id ?? "",
    staffId: null,
    dateFrom: today,
    dateTo: maxDate < addDays(today, 14) ? maxDate : addDays(today, 14),
    weekdays: [],
    timeRange: "any",
    note: "",
  });
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set =
    (k: "firstName" | "lastName" | "email" | "phone" | "dateFrom" | "dateTo" | "note") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setV({ ...v, [k]: e.target.value });

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await onSubmit({ ...v, website });
          if (!res.ok) {
            setErrors(res.fieldErrors ?? {});
            setError(res.error);
            return;
          }
          onDone(res.message);
        });
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="grid grid-cols-2 gap-3">
        <Field id="w-first" label="Prénom" error={errors.firstName}>
          <Input
            id="w-first"
            value={v.firstName}
            onChange={set("firstName")}
            autoComplete="given-name"
          />
        </Field>
        <Field id="w-last" label="Nom" error={errors.lastName}>
          <Input
            id="w-last"
            value={v.lastName}
            onChange={set("lastName")}
            autoComplete="family-name"
          />
        </Field>
      </div>
      <Field
        id="w-email"
        label="Email"
        error={errors.email}
        hint="Les créneaux libérés sont proposés par email."
      >
        <Input
          id="w-email"
          type="email"
          inputMode="email"
          value={v.email}
          onChange={set("email")}
          autoComplete="email"
        />
      </Field>
      <Field id="w-phone" label="Téléphone (facultatif)" error={errors.phone}>
        <Input
          id="w-phone"
          type="tel"
          inputMode="tel"
          value={v.phone}
          onChange={set("phone")}
          autoComplete="tel"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="w-service" label="Prestation" error={errors.serviceId}>
          <NativeSelect
            id="w-service"
            value={v.serviceId}
            onChange={(e) => setV({ ...v, serviceId: e.target.value })}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="w-staff" label="Avec" error={errors.staffId}>
          <NativeSelect
            id="w-staff"
            value={v.staffId ?? ""}
            onChange={(e) => setV({ ...v, staffId: e.target.value || null })}
          >
            <option value="">Peu importe</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field id="w-from" label="Disponible du" error={errors.dateFrom}>
          <Input
            id="w-from"
            type="date"
            min={today}
            max={maxDate}
            value={v.dateFrom}
            onChange={set("dateFrom")}
          />
        </Field>
        <Field id="w-to" label="au" error={errors.dateTo}>
          <Input
            id="w-to"
            type="date"
            min={v.dateFrom || today}
            max={maxDate}
            value={v.dateTo}
            onChange={set("dateTo")}
          />
        </Field>
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Jours possibles</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((label, i) => {
            const day = i + 1;
            const on = v.weekdays.includes(day);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setV({
                    ...v,
                    weekdays: on ? v.weekdays.filter((d) => d !== day) : [...v.weekdays, day],
                  })
                }
                className={cn(
                  "h-9 min-w-11 rounded-md border px-2.5 text-sm font-medium transition-colors",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-[13px] text-muted-foreground">
          {v.weekdays.length ? "" : "Aucun jour sélectionné : tous les jours conviennent."}
        </p>
      </fieldset>
      <Field id="w-range" label="Moment de la journée">
        <NativeSelect
          id="w-range"
          value={v.timeRange}
          onChange={(e) => setV({ ...v, timeRange: e.target.value as TimeRange })}
        >
          {(Object.keys(TIME_RANGES) as TimeRange[]).map((k) => (
            <option key={k} value={k}>
              {TIME_RANGES[k].label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="w-note" label="Message (facultatif)" error={errors.note}>
        <Textarea id="w-note" rows={2} value={v.note} onChange={set("note")} maxLength={300} />
      </Field>
      {honeypot ? (
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
