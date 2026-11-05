import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fileUrl } from "@/lib/files";
import { requirePermission } from "@/server/auth/session";
import { listServices } from "@/server/catalog/services";
import { listStaff } from "@/server/catalog/staff";
import { ServicesView } from "./services-view";

export const metadata: Metadata = { title: "Services" };

async function Content() {
  const ctx = await requirePermission("services.manage");
  const [services, staff] = await Promise.all([listServices(ctx), listStaff(ctx.organization.id, { activeOnly: true })]);
  return (
    <ServicesView
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? "",
        durationMinutes: s.durationMinutes,
        priceCents: s.priceCents,
        bufferAfterMinutes: s.bufferAfterMinutes,
        color: s.color,
        isActive: s.isActive,
        isOnlineBookable: s.isOnlineBookable,
        staffIds: s.staffIds,
        imageUrl: fileUrl(s.imageFileId),
      }))}
      staff={staff.map((s) => ({ id: s.id, name: s.displayName, color: s.color, photoUrl: fileUrl(s.photoFileId) }))}
    />
  );
}

export default function ServicesPage() {
  return (
    <>
      <PageHeader title="Services" description="Vos prestations : durée, prix et employés qui les réalisent." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content />
      </Suspense>
    </>
  );
}
