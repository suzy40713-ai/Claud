import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/domain/permissions";
import { listAppointments } from "@/server/appointments";
import { requireOrg } from "@/server/auth/session";
import { listStaff } from "@/server/catalog/staff";
import { ReservationsView } from "./reservations-view";

export const metadata: Metadata = { title: "Réservations" };

async function Content({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ctx = await requireOrg();
  const manageAll = can(ctx.role, "appointments.manage_all");
  const [{ rows, hasMore, filters }, staff] = await Promise.all([
    listAppointments(ctx, {
      when: (sp.periode as "upcoming" | "past" | "all") ?? "upcoming",
      status: (sp.statut as "all") ?? "all",
      staffId: manageAll ? sp.employe : undefined,
      q: sp.q,
      page: sp.page ? Number(sp.page) : 1,
    }),
    listStaff(ctx.organization.id),
  ]);
  return (
    <ReservationsView
      timeZone={ctx.organization.timezone}
      rows={rows.map((r) => ({ ...r, startsAt: r.startsAt.toISOString(), endsAt: r.endsAt.toISOString() }))}
      hasMore={hasMore}
      filters={{ when: filters.when, status: filters.status, staffId: filters.staffId ?? "", q: filters.q ?? "", page: filters.page }}
      staff={staff.filter((s) => manageAll || s.id === ctx.staffId).map((s) => ({ id: s.id, name: s.displayName, color: s.color }))}
      showStaffFilter={manageAll && staff.length > 1}
      canSeeCustomers={can(ctx.role, "customers.view_all")}
    />
  );
}

export default function ReservationsPage(props: PageProps<"/tableau-de-bord/reservations">) {
  return (
    <>
      <PageHeader title="Réservations" description="Tous vos rendez-vous, à venir et passés." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={props.searchParams as Promise<Record<string, string | undefined>>} />
      </Suspense>
    </>
  );
}
