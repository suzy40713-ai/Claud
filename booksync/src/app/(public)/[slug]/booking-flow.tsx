"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, UserRound } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatCents, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicBookingPage } from "@/server/booking/public";
import { bookAction, getSlotsAction } from "./actions";

type Step = "service" | "staff" | "time" | "details";
type Day = { date: string; slots: { start: string; staffIds: string[] }[] };

const DAYS_PER_PAGE = 7;

function todayIn(tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return {
    weekday: new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" }).format(dt).replace(".", ""),
    day: d,
    month: new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(dt).replace(".", ""),
    long: new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(dt),
  };
}

export function BookingFlow({ page }: { page: PublicBookingPage }) {
  const { organization: org, services, staff } = page;
  const router = useRouter();
  const tz = org.timezone;
  const today = todayIn(tz);
  const lastDate = addDays(today, org.maxAdvanceDays);

  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(today);
  const [days, setDays] = useState<Day[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [optIn, setOptIn] = useState(true);
  const [pending, startTransition] = useTransition();

  const svc = services.find((s) => s.id === serviceId) ?? null;
  const svcStaff = useMemo(() => (svc ? staff.filter((s) => svc.staffIds.includes(s.id)) : []), [svc, staff]);
  const chosenStaff = staff.find((s) => s.id === staffId) ?? null;
  const timeFmt = useMemo(() => new Intl.DateTimeFormat("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }), [tz]);

  const loadSlots = useCallback(
    async (from: string, keepSelection = false) => {
      if (!serviceId) return;
      setLoadingSlots(true);
      setError(null);
      const res = await getSlotsAction(org.slug, { serviceId, staffId, fromDate: from, days: DAYS_PER_PAGE });
      setLoadingSlots(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDays(res.data);
      if (!keepSelection) {
        const first = res.data.find((d) => d.slots.length);
        setSelectedDate(first?.date ?? res.data[0]?.date ?? null);
        setSlot(null);
      }
    },
    [org.slug, serviceId, staffId],
  );

  useEffect(() => {
    if (step === "time") void loadSlots(weekStart);
  }, [step, weekStart, loadSlots]);

  function chooseService(id: string) {
    setServiceId(id);
    const s = services.find((x) => x.id === id)!;
    setStaffId(null);
    setWeekStart(today);
    setStep(s.staffIds.length > 1 ? "staff" : "time");
  }

  function back() {
    setError(null);
    if (step === "details") setStep("time");
    else if (step === "time") setStep(svcStaff.length > 1 ? "staff" : "service");
    else setStep("service");
  }

  const currentDay = days?.find((d) => d.date === selectedDate) ?? null;
  const stepIndex = { service: 0, staff: 1, time: 2, details: 3 }[step];

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!svc || !slot) return;
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await bookAction(org.slug, {
        serviceId: svc.id,
        staffId,
        startsAt: slot,
        firstName: String(fd.get("firstName") ?? ""),
        lastName: String(fd.get("lastName") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        note: String(fd.get("note") ?? ""),
        emailOptIn: optIn,
        website: String(fd.get("website") ?? ""),
      });
      if (!res.ok) {
        setFieldErrors(res.fieldErrors ?? {});
        setError(res.error);
        if (/vient d'être réservé/.test(res.error)) {
          setStep("time");
          void loadSlots(weekStart, false);
        }
        return;
      }
      router.push(`/rdv/${res.data.token}?nouveau=1` as Route);
    });
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
        {step !== "service" ? (
          <Button variant="ghost" size="icon" onClick={back} aria-label="Étape précédente">
            <ArrowLeft />
          </Button>
        ) : null}
        <ol className="flex flex-1 items-center gap-1.5" aria-label="Étapes de la réservation">
          {["Prestation", "Avec qui", "Date et heure", "Coordonnées"].map((label, i) => (
            <li key={label} className="flex flex-1 flex-col gap-1">
              <span className={cn("h-1 rounded-full", i <= stepIndex ? "bg-primary" : "bg-muted")} />
              <span className={cn("hidden text-[11px] font-medium sm:block", i === stepIndex ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="p-4 sm:p-6">
        {error ? (
          <Alert variant="error" className="mb-5">
            {error}
          </Alert>
        ) : null}

        {step === "service" ? (
          <section aria-labelledby="step-service" className="animate-fade-up">
            <h2 id="step-service" className="mb-4 text-lg font-semibold">Choisissez une prestation</h2>
            <ul className="grid gap-2.5">
              {services.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => chooseService(s.id)}
                    className="group flex w-full items-center gap-4 rounded-xl border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none sm:p-4"
                    data-testid="public-service"
                  >
                    {s.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imageUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <span className="h-12 w-1 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{s.name}</span>
                      {s.description ? <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted-foreground">{s.description}</span> : null}
                      <span className="mt-1 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
                        <Clock className="size-3.5" /> {formatDuration(s.durationMinutes)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-semibold tabular-nums">{s.priceCents ? formatCents(s.priceCents) : "Gratuit"}</span>
                      <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "staff" && svc ? (
          <section aria-labelledby="step-staff" className="animate-fade-up">
            <h2 id="step-staff" className="mb-1 text-lg font-semibold">Avec qui ?</h2>
            <p className="mb-4 text-sm text-muted-foreground">{svc.name}</p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              <li>
                <StaffChoice
                  label="Sans préférence"
                  sub="Le premier créneau disponible"
                  icon={<UserRound className="size-5" />}
                  onClick={() => {
                    setStaffId(null);
                    setStep("time");
                  }}
                />
              </li>
              {svcStaff.map((s) => (
                <li key={s.id}>
                  <StaffChoice
                    label={s.name}
                    sub={s.bio ?? undefined}
                    icon={<Avatar name={s.name} src={s.photoUrl} color={s.color} className="size-10" />}
                    onClick={() => {
                      setStaffId(s.id);
                      setStep("time");
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "time" && svc ? (
          <section aria-labelledby="step-time" className="animate-fade-up">
            <h2 id="step-time" className="mb-1 text-lg font-semibold">Choisissez un horaire</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {svc.name} · {formatDuration(svc.durationMinutes)}
              {chosenStaff ? ` · avec ${chosenStaff.name}` : ""}
            </p>
            <div className="mb-4 flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                aria-label="Semaine précédente"
                disabled={weekStart <= today || loadingSlots}
                onClick={() => setWeekStart((w) => (addDays(w, -DAYS_PER_PAGE) < today ? today : addDays(w, -DAYS_PER_PAGE)))}
              >
                <ChevronLeft />
              </Button>
              <div className="grid flex-1 grid-cols-7 gap-1">
                {(days ?? Array.from({ length: DAYS_PER_PAGE }, (_, i) => ({ date: addDays(weekStart, i), slots: [] }))).map((d) => {
                  const l = dayLabel(d.date);
                  const has = d.slots.length > 0;
                  const active = d.date === selectedDate;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={!has || loadingSlots}
                      onClick={() => {
                        setSelectedDate(d.date);
                        setSlot(null);
                      }}
                      aria-pressed={active}
                      aria-label={`${l.long}${has ? "" : " — complet"}`}
                      className={cn(
                        "flex flex-col items-center rounded-lg py-2 text-center transition-colors",
                        active ? "bg-primary text-primary-foreground" : has ? "hover:bg-accent" : "text-muted-foreground/50",
                      )}
                    >
                      <span className="text-[11px] capitalize">{l.weekday}</span>
                      <span className="text-base font-semibold tabular-nums">{l.day}</span>
                      <span className={cn("mt-0.5 size-1 rounded-full", has ? (active ? "bg-primary-foreground" : "bg-primary") : "bg-transparent")} />
                    </button>
                  );
                })}
              </div>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Semaine suivante"
                disabled={addDays(weekStart, DAYS_PER_PAGE) > lastDate || loadingSlots}
                onClick={() => setWeekStart((w) => addDays(w, DAYS_PER_PAGE))}
              >
                <ChevronRight />
              </Button>
            </div>

            {loadingSlots || !days ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-11" />
                ))}
              </div>
            ) : currentDay && currentDay.slots.length ? (
              <>
                <p className="mb-3 text-sm font-medium first-letter:uppercase">{dayLabel(currentDay.date).long}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" role="listbox" aria-label="Horaires disponibles">
                  {currentDay.slots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      role="option"
                      aria-selected={slot === s.start}
                      onClick={() => {
                        setSlot(s.start);
                        setStep("details");
                      }}
                      className="h-11 rounded-lg border text-sm font-medium tabular-nums transition-colors hover:border-primary hover:bg-primary-soft aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-foreground"
                      data-testid="slot"
                    >
                      {timeFmt.format(new Date(s.start))}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center">
                <p className="font-medium">Aucun créneau disponible cette semaine</p>
                <p className="mt-1 text-sm text-muted-foreground">Essayez la semaine suivante{svcStaff.length > 1 && staffId ? " ou un autre membre de l'équipe" : ""}.</p>
                {addDays(weekStart, DAYS_PER_PAGE) <= lastDate ? (
                  <Button variant="secondary" className="mt-4" onClick={() => setWeekStart((w) => addDays(w, DAYS_PER_PAGE))}>
                    Semaine suivante <ChevronRight />
                  </Button>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {step === "details" && svc && slot ? (
          <section aria-labelledby="step-details" className="animate-fade-up">
            <h2 id="step-details" className="mb-4 text-lg font-semibold">Vos coordonnées</h2>
            <div className="mb-5 rounded-xl border bg-subtle p-4 text-sm">
              <p className="font-semibold">{svc.name}</p>
              <p className="mt-1 text-muted-foreground first-letter:uppercase">
                {new Intl.DateTimeFormat("fr-FR", { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(slot))}
                {" · "}
                {formatDuration(svc.durationMinutes)}
              </p>
              <p className="mt-1 text-muted-foreground">
                {chosenStaff ? `Avec ${chosenStaff.name}` : "Sans préférence d'employé"}
                {svc.priceCents ? ` · ${formatCents(svc.priceCents)} à régler sur place` : ""}
              </p>
            </div>
            <form onSubmit={submit} noValidate className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="firstName" label="Prénom" error={fieldErrors.firstName}>
                  <Input id="firstName" name="firstName" autoComplete="given-name" required />
                </Field>
                <Field id="lastName" label="Nom" error={fieldErrors.lastName}>
                  <Input id="lastName" name="lastName" autoComplete="family-name" required />
                </Field>
              </div>
              <Field id="email" label="Email" hint="Pour recevoir la confirmation et gérer votre rendez-vous." error={fieldErrors.email}>
                <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" required />
              </Field>
              <Field id="phone" label="Téléphone (facultatif)" error={fieldErrors.phone}>
                <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" />
              </Field>
              <Field id="note" label="Message (facultatif)" error={fieldErrors.note} hint="N'indiquez pas d'information médicale.">
                <Textarea id="note" name="note" maxLength={500} className="min-h-20" />
              </Field>
              {/* Champ piège pour les robots : invisible pour les humains. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
                <label>
                  Site web <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <label className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                <Checkbox checked={optIn} onCheckedChange={(v) => setOptIn(v === true)} className="mt-0.5" />
                J&apos;accepte de recevoir par email la confirmation et les rappels de ce rendez-vous.
              </label>
              <p className="text-xs text-muted-foreground">
                Vos données sont transmises à {org.name} pour la gestion de votre rendez-vous.{" "}
                <a href="/confidentialite" target="_blank" className="underline">
                  Confidentialité
                </a>
              </p>
              <Button type="submit" size="lg" disabled={pending} className="w-full">
                {pending ? <Spinner /> : <Check />}
                Confirmer le rendez-vous
              </Button>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function StaffChoice({ label, sub, icon, onClick }: { label: string; sub?: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none"
      data-testid="public-staff"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {sub ? <span className="line-clamp-1 block text-[13px] text-muted-foreground">{sub}</span> : null}
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
