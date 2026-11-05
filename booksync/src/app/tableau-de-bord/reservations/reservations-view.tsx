"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { CalendarSearch, Search } from "lucide-react";
import { AppointmentSheet } from "@/components/appointments/appointment-sheet";
import { STATUS_LABELS, type ApptView, type StaffOpt } from "@/components/appointments/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { capitalize, formatCents, formatInTz } from "@/lib/format";
import { cn } from "@/lib/utils";

const variant = { confirmed: "primary", cancelled: "destructive", completed: "success", no_show: "warning" } as const;

export function ReservationsView({
  timeZone,
  rows,
  hasMore,
  filters,
  staff,
  showStaffFilter,
  canSeeCustomers,
}: {
  timeZone: string;
  rows: ApptView[];
  hasMore: boolean;
  filters: { when: string; status: string; staffId: string; q: string; page: number };
  staff: StaffOpt[];
  showStaffFilter: boolean;
  canSeeCustomers: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState<ApptView | null>(null);
  const [q, setQ] = useState(filters.q);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.push(`${pathname}?${next.toString()}` as Route);
  }

  let lastDay = "";
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div role="tablist" className="inline-flex rounded-lg border bg-card p-0.5">
          {[
            ["upcoming", "À venir"],
            ["past", "Passées"],
            ["all", "Toutes"],
          ].map(([v, l]) => (
            <button
              key={v}
              role="tab"
              aria-selected={filters.when === v}
              onClick={() => setParam("periode", v === "upcoming" ? "" : v)}
              className={cn("h-8 flex-1 rounded-md px-3 text-sm font-medium sm:flex-none", filters.when === v ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground")}
            >
              {l}
            </button>
          ))}
        </div>
        <NativeSelect aria-label="Statut" value={filters.status} onChange={(e) => setParam("statut", e.target.value === "all" ? "" : e.target.value)} className="h-9 text-sm sm:w-40">
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </NativeSelect>
        {showStaffFilter ? (
          <NativeSelect aria-label="Employé" value={filters.staffId} onChange={(e) => setParam("employe", e.target.value)} className="h-9 text-sm sm:w-44">
            <option value="">Toute l&apos;équipe</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        ) : null}
        <form
          className="relative sm:ml-auto sm:w-64"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q.trim());
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Rechercher" placeholder="Client ou prestation…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-9" />
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<CalendarSearch />} title="Aucune réservation" description="Aucun rendez-vous ne correspond à ces critères." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {rows.map((r) => {
              const day = formatInTz(r.startsAt, timeZone, "yyyy-MM-dd");
              const header = day !== lastDay;
              lastDay = day;
              return (
                <li key={r.id}>
                  {header ? (
                    <p className="bg-subtle px-4 py-2 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase sm:px-5">
                      {capitalize(formatInTz(r.startsAt, timeZone, "EEEE d MMMM yyyy"))}
                    </p>
                  ) : null}
                  <button type="button" onClick={() => setOpen(r)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent sm:px-5" data-testid="reservation-row">
                    <span className="w-12 shrink-0 text-sm font-semibold tabular-nums">{formatInTz(r.startsAt, timeZone, "HH:mm")}</span>
                    <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: r.serviceColor ?? r.staffColor }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {r.customerFirstName} {r.customerLastName}
                      </span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {r.serviceName} · {r.staffName}
                      </span>
                    </span>
                    <span className="hidden text-sm tabular-nums sm:block">{r.priceCents ? formatCents(r.priceCents) : ""}</span>
                    <Badge variant={variant[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {filters.page > 1 || hasMore ? (
        <div className="flex justify-between">
          <Button variant="secondary" disabled={filters.page <= 1} onClick={() => setParam("page", String(filters.page - 1))}>
            Précédent
          </Button>
          <Button variant="secondary" disabled={!hasMore} onClick={() => setParam("page", String(filters.page + 1))}>
            Suivant
          </Button>
        </div>
      ) : null}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {open ? (
          <AppointmentSheet
            key={open.id}
            appt={open}
            timeZone={timeZone}
            staff={staff}
            canSeeCustomers={canSeeCustomers}
            onChanged={() => {
              setOpen(null);
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
