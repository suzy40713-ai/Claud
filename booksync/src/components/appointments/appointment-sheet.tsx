"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { toast } from "sonner";
import { Ban, CalendarClock, Check, Mail, Phone, UserX, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { capitalize, formatCents, formatInTz } from "@/lib/format";
import {
  cancelAppointmentAction,
  rescheduleAppointmentAction,
  setAttendanceAction,
  updateNoteAction,
} from "@/app/tableau-de-bord/appointment-actions";
import { STATUS_LABELS, type ApptView, type StaffOpt } from "./types";
import { localInputToIso } from "./time";

export function AppointmentSheet({
  appt,
  timeZone,
  staff,
  canSeeCustomers,
  onChanged,
}: {
  appt: ApptView;
  timeZone: string;
  staff: StaffOpt[];
  canSeeCustomers: boolean;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "move" | "cancel">("view");
  const [note, setNote] = useState(appt.internalNote ?? "");
  const start = new Date(appt.startsAt);
  const isPast = start < new Date();
  const active = appt.status !== "cancelled";

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message ?? "Enregistré.");
        onChanged();
      } else toast.error(res.error);
    });
  }

  const statusVariant = { confirmed: "primary", cancelled: "destructive", completed: "success", no_show: "warning" } as const;

  return (
    <DialogContent
      title={`${appt.customerFirstName} ${appt.customerLastName}`}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant[appt.status]}>{STATUS_LABELS[appt.status]}</Badge>
          <span>{appt.source === "online" ? "Réservé en ligne" : "Ajouté manuellement"}</span>
        </span>
      }
    >
      <div className="grid gap-5" data-testid="appointment-sheet">
        <dl className="grid gap-2.5 rounded-xl border bg-subtle p-4 text-sm">
          <Row k="Prestation" v={appt.serviceName} />
          <Row k="Date" v={capitalize(formatInTz(start, timeZone, "EEEE d MMMM yyyy"))} />
          <Row k="Heure" v={`${formatInTz(start, timeZone, "HH:mm")} – ${formatInTz(appt.endsAt, timeZone, "HH:mm")}`} />
          <Row k="Avec" v={appt.staffName} />
          {appt.priceCents ? <Row k="Prix" v={formatCents(appt.priceCents)} /> : null}
          {appt.customerNote ? <Row k="Message" v={appt.customerNote} /> : null}
          {appt.cancellationReason ? <Row k="Motif" v={appt.cancellationReason} /> : null}
        </dl>

        <div className="flex flex-wrap gap-2">
          {appt.customerPhone ? (
            <Button asChild variant="secondary" size="sm">
              <a href={`tel:${appt.customerPhone.replace(/\s/g, "")}`}>
                <Phone /> {appt.customerPhone}
              </a>
            </Button>
          ) : null}
          {appt.customerEmail ? (
            <Button asChild variant="secondary" size="sm">
              <a href={`mailto:${appt.customerEmail}`}>
                <Mail /> Email
              </a>
            </Button>
          ) : null}
          {canSeeCustomers ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/tableau-de-bord/clients/${appt.customerId}` as Route}>Fiche client →</Link>
            </Button>
          ) : null}
        </div>

        {mode === "move" ? (
          <MoveForm appt={appt} timeZone={timeZone} staff={staff} pending={pending} onCancel={() => setMode("view")} onSubmit={(input) => run(() => rescheduleAppointmentAction(appt.id, input))} />
        ) : mode === "cancel" ? (
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const reason = String(new FormData(e.currentTarget).get("reason") ?? "");
              run(() => cancelAppointmentAction(appt.id, reason));
            }}
          >
            <Field id="cancel-reason" label="Motif de l'annulation (facultatif)" hint="Communiqué au client dans l'email d'annulation.">
              <Textarea id="cancel-reason" name="reason" maxLength={300} className="min-h-16" />
            </Field>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setMode("view")}>
                Retour
              </Button>
              <Button type="submit" variant="destructive" disabled={pending} className="flex-1">
                {pending ? <Spinner /> : null}
                Confirmer l&apos;annulation
              </Button>
            </div>
          </form>
        ) : active ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {appt.status === "confirmed" ? (
              <>
                <Button variant="secondary" onClick={() => setMode("move")}>
                  <CalendarClock /> Déplacer
                </Button>
                <Button variant="secondary" className="text-destructive" onClick={() => setMode("cancel")}>
                  <Ban /> Annuler
                </Button>
              </>
            ) : null}
            {isPast && appt.status === "confirmed" ? (
              <>
                <Button variant="secondary" disabled={pending} onClick={() => run(() => setAttendanceAction(appt.id, "completed"))}>
                  <Check /> Honoré
                </Button>
                <Button variant="secondary" disabled={pending} onClick={() => run(() => setAttendanceAction(appt.id, "no_show"))}>
                  <UserX /> Absent
                </Button>
              </>
            ) : null}
            {appt.status === "completed" || appt.status === "no_show" ? (
              <Button variant="secondary" disabled={pending} onClick={() => run(() => setAttendanceAction(appt.id, "confirmed"))}>
                <Undo2 /> Rétablir « confirmé »
              </Button>
            ) : null}
          </div>
        ) : null}

        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateNoteAction(appt.id, note));
          }}
        >
          <Field id="internal-note" label="Note interne" hint="Visible uniquement par votre équipe. Pas de données de santé.">
            <Textarea id="internal-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className="min-h-16" />
          </Field>
          <Button type="submit" variant="ghost" size="sm" disabled={pending || note === (appt.internalNote ?? "")} className="justify-self-end">
            Enregistrer la note
          </Button>
        </form>
      </div>
    </DialogContent>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium break-words">{v}</dd>
    </div>
  );
}

function MoveForm({
  appt,
  timeZone,
  staff,
  pending,
  onCancel,
  onSubmit,
}: {
  appt: ApptView;
  timeZone: string;
  staff: StaffOpt[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: { startsAt: string; staffId: string }) => void;
}) {
  const [date, setDate] = useState(formatInTz(appt.startsAt, timeZone, "yyyy-MM-dd"));
  const [time, setTime] = useState(formatInTz(appt.startsAt, timeZone, "HH:mm"));
  const [staffId, setStaffId] = useState(appt.staffId);
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ startsAt: localInputToIso(date, time, timeZone), staffId });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field id="move-date" label="Date">
          <Input id="move-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field id="move-time" label="Heure">
          <Input id="move-time" type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} required />
        </Field>
      </div>
      {staff.length > 1 ? (
        <Field id="move-staff" label="Avec">
          <NativeSelect id="move-staff" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      <p className="text-[13px] text-muted-foreground">Le client sera prévenu par email (selon votre forfait). Les chevauchements sont refusés.</p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Retour
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? <Spinner /> : null}
          Déplacer le rendez-vous
        </Button>
      </div>
    </form>
  );
}
