import type { Metadata } from "next";
import { Suspense } from "react";
import { eq, max, min } from "drizzle-orm";
import { db } from "@/db/client";
import { workingHours } from "@/db/schema";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/domain/permissions";
import { requireOrg } from "@/server/auth/session";
import { listServices } from "@/server/catalog/services";
import { listStaff } from "@/server/catalog/staff";
import { Calendar } from "./calendar";

export const metadata: Metadata = { title: "Calendrier" };

async function Content() {
  const ctx = await requireOrg();
  const manageAll = can(ctx.role, "appointments.manage_all");
  const [staff, services, [bounds]] = await Promise.all([
    listStaff(ctx.organization.id, { activeOnly: true }),
    listServices(ctx),
    db
      .select({ start: min(workingHours.startMinute), end: max(workingHours.endMinute) })
      .from(workingHours)
      .where(eq(workingHours.organizationId, ctx.organization.id)),
  ]);
  const start = Math.max(0, Math.min(8, Math.floor((bounds?.start ?? 480) / 60) - 1));
  const end = Math.min(24, Math.max(19, Math.ceil((bounds?.end ?? 1140) / 60) + 1));
  const visible = manageAll ? staff : staff.filter((s) => s.id === ctx.staffId);
  return (
    <Calendar
      timeZone={ctx.organization.timezone}
      staff={visible.map((s) => ({ id: s.id, name: s.displayName, color: s.color }))}
      services={services
        .filter((s) => s.isActive)
        .map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
          staffIds: s.staffIds,
        }))}
      canManageAll={manageAll}
      canSeeCustomers={can(ctx.role, "customers.view_all")}
      ownStaffId={ctx.staffId}
      hourRange={{ start, end }}
    />
  );
}

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendrier"
        description="Touchez un horaire libre pour ajouter un rendez-vous."
      />
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <Content />
      </Suspense>
    </>
  );
}
