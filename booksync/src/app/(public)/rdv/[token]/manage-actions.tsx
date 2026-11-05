"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus, ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { cancelByTokenAction, rescheduleByTokenAction, slotsForTokenAction } from "./actions";

type Day = { date: string; slots: { start: string }[] };
const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export function ManageActions({
  token,
  timeZone,
  canChange,
  cancelled,
  past,
  deadlineLabel,
  bookingUrl,
}: {
  token: string;
  timeZone: string;
  canChange: boolean;
  cancelled: boolean;
  past: boolean;
  deadlineLabel: string;
  bookingUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<null | "cancel" | "move">(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<Day[] | null>(null);
  const [from, setFrom] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date()));
  const [date, setDate] = useState<string | null>(null);
  const time = new Intl.DateTimeFormat("fr-FR", { timeZone, hour: "2-digit", minute: "2-digit" });

  function load(start: string) {
    setDays(null);
    startTransition(async () => {
      const res = await slotsForTokenAction(token, start);
      if (!res.ok) return setError(res.error);
      setDays(res.data);
      setDate(res.data.find((d) => d.slots.length)?.date ?? null);
    });
  }

  if (cancelled || past) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={bookingUrl as Route}>Reprendre rendez-vous</Link>
      </Button>
    );
  }

  return (
    <div className="grid gap-3">
      <Button asChild variant="secondary" size="lg" className="w-full">
        <a href={`/api/rdv/${token}/ics`}>
          <CalendarPlus /> Ajouter à mon agenda
        </a>
      </Button>
      {canChange ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setError(null);
              setMode("move");
              load(from);
            }}
          >
            <RefreshCw /> Déplacer
          </Button>
          <Button variant="secondary" size="lg" className="text-destructive" onClick={() => (setError(null), setMode("cancel"))}>
            <X /> Annuler
          </Button>
        </div>
      ) : (
        <p className="text-center text-[13px] text-muted-foreground">
          La modification en ligne n&apos;est plus possible. Contactez directement l&apos;établissement.
        </p>
      )}
      {canChange ? <p className="text-center text-xs text-muted-foreground">Modification ou annulation possible jusqu&apos;au {deadlineLabel}.</p> : null}

      <Dialog open={mode === "cancel"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent title="Annuler ce rendez-vous ?" description="L'établissement sera prévenu et le créneau libéré.">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const reason = String(new FormData(e.currentTarget).get("reason") ?? "");
              startTransition(async () => {
                const res = await cancelByTokenAction(token, reason);
                if (!res.ok) return setError(res.error);
                toast.success(res.message);
                setMode(null);
                router.refresh();
              });
            }}
          >
            {error ? <Alert variant="error">{error}</Alert> : null}
            <Field id="reason" label="Motif (facultatif)">
              <Textarea id="reason" name="reason" maxLength={300} className="min-h-20" />
            </Field>
            <Button type="submit" variant="destructive" size="lg" disabled={pending} className="w-full">
              {pending ? <Spinner /> : null}
              Confirmer l&apos;annulation
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "move"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent title="Choisir un nouvel horaire" description="Même prestation, même professionnel.">
          <div className="grid gap-4">
            {error ? <Alert variant="error">{error}</Alert> : null}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" aria-label="Semaine précédente" onClick={() => { const f = addDays(from, -7); setFrom(f); load(f); }}>
                <ChevronLeft />
              </Button>
              <div className="grid flex-1 grid-cols-7 gap-1">
                {(days ?? []).map((d) => {
                  const [y, m, dd] = d.date.split("-").map(Number);
                  const label = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, dd, 12)));
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={!d.slots.length}
                      aria-pressed={date === d.date}
                      onClick={() => setDate(d.date)}
                      className={cn("flex flex-col items-center rounded-lg py-1.5 text-xs", date === d.date ? "bg-primary text-primary-foreground" : d.slots.length ? "hover:bg-accent" : "opacity-40")}
                    >
                      <span className="capitalize">{label.replace(".", "")}</span>
                      <span className="text-sm font-semibold">{dd}</span>
                    </button>
                  );
                })}
              </div>
              <Button variant="secondary" size="icon" aria-label="Semaine suivante" onClick={() => { const f = addDays(from, 7); setFrom(f); load(f); }}>
                <ChevronRight />
              </Button>
            </div>
            {!days ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(days.find((d) => d.date === date)?.slots ?? []).map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    disabled={pending}
                    className="h-11 rounded-lg border text-sm font-medium tabular-nums hover:border-primary hover:bg-primary-soft"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await rescheduleByTokenAction(token, s.start);
                        if (!res.ok) {
                          setError(res.error);
                          load(from);
                          return;
                        }
                        toast.success(res.message);
                        setMode(null);
                        router.refresh();
                      })
                    }
                  >
                    {time.format(new Date(s.start))}
                  </button>
                ))}
                {days.every((d) => !d.slots.length) ? <p className="col-span-full py-6 text-center text-sm text-muted-foreground">Aucun créneau cette semaine.</p> : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
