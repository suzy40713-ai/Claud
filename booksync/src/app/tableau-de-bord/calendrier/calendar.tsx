"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppointmentSheet } from "@/components/appointments/appointment-sheet";
import { CreateAppointment } from "@/components/appointments/create-appointment";
import {
  dateOf,
  daysInMonth,
  localMidnight,
  minutesOfDay,
  shiftDate,
  startOfMonth,
  startOfWeek,
  todayInTz,
} from "@/components/appointments/time";
import type { ApptView, ServiceOpt, StaffOpt } from "@/components/appointments/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { listRangeAction } from "../appointment-actions";

type View = "day" | "week" | "month";
type Absence = {
  id: string;
  staffId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

const PX_PER_MIN = 1.1;
const MOBILE_QUERY = "(max-width: 640px)";
function subscribeMobile(callback: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
const fmtDay = (date: string, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { ...opts, timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
};

export function Calendar({
  timeZone,
  staff,
  services,
  canManageAll,
  canSeeCustomers,
  ownStaffId,
  hourRange,
}: {
  timeZone: string;
  staff: StaffOpt[];
  services: ServiceOpt[];
  canManageAll: boolean;
  canSeeCustomers: boolean;
  ownStaffId: string | null;
  hourRange: { start: number; end: number };
}) {
  const today = todayInTz(timeZone);
  // Vue jour par défaut sur mobile, semaine sur ordinateur (tant que l'utilisateur n'a pas choisi).
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
  const [chosenView, setView] = useState<View | null>(null);
  const view: View = chosenView ?? (isMobile ? "day" : "week");
  const [anchor, setAnchor] = useState(today);
  const [staffFilter, setStaffFilter] = useState<string>(
    canManageAll ? "all" : (ownStaffId ?? "all"),
  );
  const [data, setData] = useState<{
    key: string;
    appointments: ApptView[];
    absences: Absence[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openAppt, setOpenAppt] = useState<ApptView | null>(null);
  const [create, setCreate] = useState<{ date: string; time: string; staffId?: string } | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => {
    if (view === "day") return { from: anchor, days: 1 };
    if (view === "week") return { from: startOfWeek(anchor), days: 7 };
    const first = startOfMonth(anchor);
    const gridStart = startOfWeek(first);
    const end = shiftDate(first, daysInMonth(first) - 1);
    const gridEnd = shiftDate(startOfWeek(end), 6);
    const days = Math.round((Date.parse(gridEnd) - Date.parse(gridStart)) / 86_400_000) + 1;
    return { from: gridStart, days };
  }, [view, anchor]);

  const visibleStaff = staffFilter === "all" ? staff : staff.filter((s) => s.id === staffFilter);

  const key = `${range.from}:${range.days}:${staffFilter}`;
  const [reloadToken, setReloadToken] = useState(0);
  const loading = data?.key !== `${key}:${reloadToken}`;
  const load = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    listRangeAction({
      from: localMidnight(range.from, timeZone).toISOString(),
      to: localMidnight(shiftDate(range.from, range.days), timeZone).toISOString(),
      staffIds: staffFilter === "all" ? undefined : [staffFilter],
    }).then((res) => {
      if (cancelled) return;
      if (!res.ok) return setError(res.error);
      setError(null);
      setData({
        key: `${key}:${reloadToken}`,
        ...(res.data as { appointments: ApptView[]; absences: Absence[] }),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [range, staffFilter, timeZone, key, reloadToken]);

  // Ouverture centrée sur l'heure actuelle (ou le début de journée).
  useEffect(() => {
    if (view === "month" || !scrollRef.current) return;
    const now = minutesOfDay(new Date().toISOString(), timeZone);
    const target = Math.max(
      0,
      (Math.max(now - 90, hourRange.start * 60) - hourRange.start * 60) * PX_PER_MIN,
    );
    scrollRef.current.scrollTop = target;
  }, [view, hourRange.start, timeZone]);

  const step = view === "day" ? 1 : view === "week" ? 7 : 0;
  function move(dir: -1 | 1) {
    if (view === "month") {
      const [y, m] = anchor.split("-").map(Number);
      const d = new Date(Date.UTC(y, m - 1 + dir, 1));
      setAnchor(d.toISOString().slice(0, 10));
    } else setAnchor((a) => shiftDate(a, dir * step));
  }

  const title =
    view === "day"
      ? fmtDay(anchor, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : view === "week"
        ? `${fmtDay(range.from, { day: "numeric", month: "short" })} – ${fmtDay(shiftDate(range.from, 6), { day: "numeric", month: "short", year: "numeric" })}`
        : fmtDay(anchor, { month: "long", year: "numeric" });

  const appts = (data?.appointments ?? []).filter(
    (a) => a.status !== "cancelled" || view === "day",
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Période précédente"
            onClick={() => move(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Période suivante"
            onClick={() => move(1)}
          >
            <ChevronRight />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAnchor(today)}>
            Aujourd&apos;hui
          </Button>
          <h2
            className="ml-1 truncate text-base font-semibold first-letter:uppercase sm:text-lg"
            data-testid="calendar-title"
          >
            {title}
          </h2>
          {loading ? (
            <span
              className="size-2 animate-pulse rounded-full bg-primary"
              aria-label="Chargement"
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManageAll && staff.length > 1 ? (
            <NativeSelect
              aria-label="Filtrer par employé"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="h-9 w-44 text-sm"
            >
              <option value="all">Toute l&apos;équipe</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          ) : null}
          <div
            role="tablist"
            aria-label="Vue"
            className="inline-flex rounded-lg border bg-card p-0.5"
          >
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium",
                  view === v
                    ? "bg-primary-soft text-primary-soft-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() =>
              setCreate({
                date: anchor < today ? today : anchor,
                time: "09:00",
                staffId: staffFilter === "all" ? undefined : staffFilter,
              })
            }
          >
            <Plus /> Rendez-vous
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {view === "month" ? (
        <MonthGrid
          from={range.from}
          days={range.days}
          month={anchor.slice(0, 7)}
          today={today}
          appts={appts}
          timeZone={timeZone}
          onPickDay={(d) => {
            setAnchor(d);
            setView("day");
          }}
        />
      ) : (
        <TimeGrid
          scrollRef={scrollRef}
          columns={
            view === "week"
              ? Array.from({ length: 7 }, (_, i) => {
                  const date = shiftDate(range.from, i);
                  return {
                    key: date,
                    date,
                    staffId: staffFilter === "all" ? undefined : staffFilter,
                    label: fmtDay(date, { weekday: "short", day: "numeric" }),
                  };
                })
              : visibleStaff.map((s) => ({
                  key: s.id,
                  date: anchor,
                  staffId: s.id,
                  label: s.name,
                  color: s.color,
                }))
          }
          today={today}
          hourRange={hourRange}
          appts={appts}
          absences={data?.absences ?? []}
          timeZone={timeZone}
          onOpen={setOpenAppt}
          onCreate={(date, minute, staffId) =>
            setCreate({
              date,
              time: `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
              staffId,
            })
          }
        />
      )}

      <Dialog open={!!openAppt} onOpenChange={(o) => !o && setOpenAppt(null)}>
        {openAppt ? (
          <AppointmentSheet
            key={openAppt.id}
            appt={openAppt}
            timeZone={timeZone}
            staff={staff}
            canSeeCustomers={canSeeCustomers}
            onChanged={() => {
              setOpenAppt(null);
              load();
            }}
          />
        ) : null}
      </Dialog>
      <Dialog open={!!create} onOpenChange={(o) => !o && setCreate(null)}>
        {create ? (
          <CreateAppointment
            key={`${create.date}-${create.time}-${create.staffId}`}
            timeZone={timeZone}
            services={services}
            staff={canManageAll ? staff : staff.filter((s) => s.id === ownStaffId)}
            defaults={create}
            onCreated={() => {
              setCreate(null);
              load();
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function TimeGrid({
  columns,
  today,
  hourRange,
  appts,
  absences,
  timeZone,
  onOpen,
  onCreate,
  scrollRef,
}: {
  columns: { key: string; date: string; staffId?: string; label: string; color?: string }[];
  today: string;
  hourRange: { start: number; end: number };
  appts: ApptView[];
  absences: Absence[];
  timeZone: string;
  onOpen: (a: ApptView) => void;
  onCreate: (date: string, minute: number, staffId?: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const startMin = hourRange.start * 60;
  const endMin = hourRange.end * 60;
  const height = (endMin - startMin) * PX_PER_MIN;
  const hours = Array.from(
    { length: hourRange.end - hourRange.start },
    (_, i) => hourRange.start + i,
  );
  const nowMin = minutesOfDay(new Date().toISOString(), timeZone);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div ref={scrollRef} className="max-h-[70dvh] overflow-auto">
        <div
          className="min-w-full"
          style={{ minWidth: columns.length > 3 ? columns.length * 110 + 56 : undefined }}
        >
          <div
            className="sticky top-0 z-20 grid border-b bg-card"
            style={{ gridTemplateColumns: `56px repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            <div />
            {columns.map((c) => (
              <div
                key={c.key}
                className={cn(
                  "truncate border-l px-2 py-2 text-center text-[13px] font-medium capitalize",
                  c.date === today && !c.color ? "text-primary" : "",
                )}
              >
                {c.color ? (
                  <span
                    className="mr-1.5 inline-block size-2 rounded-full align-middle"
                    style={{ backgroundColor: c.color }}
                  />
                ) : null}
                {c.label}
              </div>
            ))}
          </div>
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `56px repeat(${columns.length}, minmax(0, 1fr))`,
              height,
            }}
          >
            <div className="relative">
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums"
                  style={{ top: (h * 60 - startMin) * PX_PER_MIN }}
                >
                  {h > hourRange.start ? `${h}:00` : ""}
                </span>
              ))}
            </div>
            {columns.map((c) => {
              const colAppts = appts.filter(
                (a) =>
                  dateOf(a.startsAt, timeZone) === c.date &&
                  (!c.staffId || a.staffId === c.staffId),
              );
              const colAbs = absences.filter(
                (a) =>
                  (a.staffId === null || !c.staffId || a.staffId === c.staffId) &&
                  dateOf(a.startsAt, timeZone) <= c.date &&
                  dateOf(new Date(new Date(a.endsAt).getTime() - 1).toISOString(), timeZone) >=
                    c.date,
              );
              return (
                <div
                  key={c.key}
                  className="relative cursor-pointer border-l"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const minute =
                      Math.floor(((e.clientY - rect.top) / PX_PER_MIN + startMin) / 15) * 15;
                    onCreate(c.date, Math.min(Math.max(minute, 0), 1425), c.staffId);
                  }}
                  data-testid="calendar-column"
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-border/60"
                      style={{ top: (h * 60 - startMin) * PX_PER_MIN }}
                    />
                  ))}
                  {colAbs.map((a) => {
                    const s =
                      dateOf(a.startsAt, timeZone) < c.date
                        ? 0
                        : minutesOfDay(a.startsAt, timeZone);
                    const endDate = dateOf(a.endsAt, timeZone);
                    const e = endDate > c.date ? 1440 : minutesOfDay(a.endsAt, timeZone) || 1440;
                    const top = Math.max(0, (s - startMin) * PX_PER_MIN);
                    const bottom = Math.min(height, (e - startMin) * PX_PER_MIN);
                    if (bottom <= top) return null;
                    return (
                      <div
                        key={a.id}
                        className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_6px,transparent_6px,transparent_12px)] px-1.5 py-1 text-[11px] text-muted-foreground"
                        style={{ top, height: bottom - top }}
                        title={a.reason ?? (a.staffId ? "Absence" : "Fermeture")}
                      >
                        {a.reason ?? (a.staffId ? "Absence" : "Fermé")}
                      </div>
                    );
                  })}
                  {c.date === today && nowMin >= startMin && nowMin <= endMin ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-destructive"
                      style={{ top: (nowMin - startMin) * PX_PER_MIN }}
                    >
                      <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-destructive" />
                    </div>
                  ) : null}
                  {colAppts.map((a) => {
                    const s = minutesOfDay(a.startsAt, timeZone);
                    const e = Math.max(s + 15, minutesOfDay(a.endsAt, timeZone) || 1440);
                    const color = a.serviceColor ?? a.staffColor;
                    const cancelled = a.status === "cancelled";
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onOpen(a);
                        }}
                        className={cn(
                          "absolute inset-x-1 z-10 overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight shadow-xs transition-shadow hover:shadow-md",
                          cancelled ? "bg-muted text-muted-foreground line-through opacity-70" : "",
                        )}
                        style={{
                          top: (s - startMin) * PX_PER_MIN + 1,
                          height: Math.max(22, (e - s) * PX_PER_MIN - 2),
                          borderLeftColor: color,
                          backgroundColor: cancelled
                            ? undefined
                            : `color-mix(in oklab, ${color} 14%, var(--card))`,
                        }}
                        data-testid="calendar-event"
                      >
                        <span className="block truncate font-semibold">
                          {a.customerFirstName} {a.customerLastName}
                        </span>
                        <span className="block truncate opacity-80">
                          {new Intl.DateTimeFormat("fr-FR", {
                            timeZone,
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(a.startsAt))}{" "}
                          · {a.serviceName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  from,
  days,
  month,
  today,
  appts,
  timeZone,
  onPickDay,
}: {
  from: string;
  days: number;
  month: string;
  today: string;
  appts: ApptView[];
  timeZone: string;
  onPickDay: (d: string) => void;
}) {
  const byDay = new Map<string, ApptView[]>();
  for (const a of appts) {
    const d = dateOf(a.startsAt, timeZone);
    byDay.set(d, [...(byDay.get(d) ?? []), a]);
  }
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b bg-subtle text-center text-[12px] font-medium text-muted-foreground">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: days }, (_, i) => {
          const date = shiftDate(from, i);
          const list = byDay.get(date) ?? [];
          const inMonth = date.startsWith(month);
          return (
            <button
              key={date}
              type="button"
              onClick={() => onPickDay(date)}
              className={cn(
                "min-h-20 border-t border-l p-1.5 text-left align-top transition-colors hover:bg-accent sm:min-h-28",
                i % 7 === 0 && "border-l-0",
                !inMonth && "bg-subtle/60 text-muted-foreground",
              )}
              aria-label={`${date} : ${list.length} rendez-vous`}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-[13px] tabular-nums",
                  date === today && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {Number(date.slice(8))}
              </span>
              <span className="mt-1 hidden gap-0.5 sm:grid">
                {list.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    className="truncate rounded px-1 text-[11px]"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${a.serviceColor ?? a.staffColor} 16%, transparent)`,
                    }}
                  >
                    {new Intl.DateTimeFormat("fr-FR", {
                      timeZone,
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(a.startsAt))}{" "}
                    {a.customerLastName}
                  </span>
                ))}
                {list.length > 3 ? (
                  <span className="px-1 text-[11px] text-muted-foreground">+{list.length - 3}</span>
                ) : null}
              </span>
              {list.length ? (
                <span className="mt-1 inline-flex rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground sm:hidden">
                  {list.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
