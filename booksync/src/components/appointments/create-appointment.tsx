"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, UserPlus, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatCents, formatDuration } from "@/lib/format";
import {
  createAppointmentAction,
  searchCustomersAction,
} from "@/app/tableau-de-bord/appointment-actions";
import { localInputToIso } from "./time";
import type { ServiceOpt, StaffOpt } from "./types";

type Found = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
};

export function CreateAppointment({
  timeZone,
  services,
  staff,
  defaults,
  onCreated,
}: {
  timeZone: string;
  services: ServiceOpt[];
  staff: StaffOpt[];
  defaults: { date: string; time: string; staffId?: string };
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const svc = services.find((s) => s.id === serviceId);
  const allowedStaff =
    svc && svc.staffIds.length ? staff.filter((s) => svc.staffIds.includes(s.id)) : staff;
  const [staffId, setStaffId] = useState(
    defaults.staffId ?? allowedStaff[0]?.id ?? staff[0]?.id ?? "",
  );
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Found[]>([]);
  const [selected, setSelected] = useState<Found | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (selected || creatingNew || query.trim().length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const found = await searchCustomersAction(query);
      if (!cancelled) setResults(found);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, selected, creatingNew]);

  if (!services.length) {
    return (
      <DialogContent title="Nouveau rendez-vous">
        <Alert>Créez d&apos;abord une prestation dans l&apos;onglet Services.</Alert>
      </DialogContent>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createAppointmentAction({
        serviceId,
        staffId,
        startsAt: localInputToIso(date, time, timeZone),
        customerId: selected?.id ?? null,
        newCustomer: !selected ? { ...newCustomer, emailOptIn: true } : null,
        internalNote: note,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setError(res.error);
        return;
      }
      toast.success(res.message);
      onCreated();
    });
  }

  return (
    <DialogContent
      title="Nouveau rendez-vous"
      description="Ajout manuel (téléphone, sur place…). Les chevauchements sont refusés."
    >
      <form onSubmit={submit} className="grid gap-4" noValidate>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <Field id="new-service" label="Prestation" error={errors.serviceId}>
          <NativeSelect
            id="new-service"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              const s = services.find((x) => x.id === e.target.value);
              if (s?.staffIds.length && !s.staffIds.includes(staffId)) setStaffId(s.staffIds[0]);
            }}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatDuration(s.durationMinutes)}
                {s.priceCents ? ` — ${formatCents(s.priceCents)}` : ""}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {staff.length > 1 ? (
          <Field id="new-staff" label="Avec" error={errors.staffId}>
            <NativeSelect
              id="new-staff"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {svc?.staffIds.length && !svc.staffIds.includes(s.id)
                    ? " (ne réalise pas ce service)"
                    : ""}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field id="new-date" label="Date" error={errors.startsAt}>
            <Input
              id="new-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <Field id="new-time" label="Heure">
            <Input
              id="new-time"
              type="time"
              step={300}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </Field>
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Client</legend>
          {selected ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-subtle px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {selected.firstName} {selected.lastName}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {selected.email ?? selected.phone ?? "—"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Changer de client"
                onClick={() => setSelected(null)}
              >
                <X />
              </Button>
            </div>
          ) : creatingNew ? (
            <div className="grid gap-3 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-3">
                <Field id="nc-first" label="Prénom" error={errors["newCustomer.firstName"]}>
                  <Input
                    id="nc-first"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                  />
                </Field>
                <Field id="nc-last" label="Nom" error={errors["newCustomer.lastName"]}>
                  <Input
                    id="nc-last"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                  />
                </Field>
              </div>
              <Field id="nc-email" label="Email (facultatif)" error={errors["newCustomer.email"]}>
                <Input
                  id="nc-email"
                  type="email"
                  inputMode="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </Field>
              <Field
                id="nc-phone"
                label="Téléphone (facultatif)"
                error={errors["newCustomer.phone"]}
              >
                <Input
                  id="nc-phone"
                  type="tel"
                  inputMode="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-self-start"
                onClick={() => setCreatingNew(false)}
              >
                Rechercher un client existant
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Rechercher un client"
                  placeholder="Nom, email ou téléphone…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {query.trim().length >= 2 ? (
                <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
                  {results.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent"
                        onClick={() => setSelected(c)}
                      >
                        <span className="block text-sm font-medium">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="block text-[13px] text-muted-foreground">
                          {c.email ?? c.phone ?? ""}
                        </span>
                      </button>
                    </li>
                  ))}
                  {!results.length ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">
                      Aucun client trouvé.
                    </li>
                  ) : null}
                </ul>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="justify-self-start"
                onClick={() => {
                  const [first, ...rest] = query.trim().split(/\s+/);
                  setNewCustomer((n) => ({
                    ...n,
                    firstName: first ?? "",
                    lastName: rest.join(" "),
                  }));
                  setCreatingNew(true);
                }}
              >
                <UserPlus /> Nouveau client
              </Button>
              {errors.customer ? (
                <p className="text-[13px] text-destructive">{errors.customer}</p>
              ) : null}
            </div>
          )}
        </fieldset>

        <Field id="new-note" label="Note interne (facultatif)">
          <Textarea
            id="new-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            className="min-h-16"
          />
        </Field>
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? <Spinner /> : null}
          Créer le rendez-vous
        </Button>
      </form>
    </DialogContent>
  );
}
