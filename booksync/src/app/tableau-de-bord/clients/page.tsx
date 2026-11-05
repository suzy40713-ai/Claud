import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";
import { listCustomers } from "@/server/customers/service";
import { CustomersView } from "./customers-view";

export const metadata: Metadata = { title: "Clients" };

async function Content({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePermission("customers.view_all");
  const data = await listCustomers(ctx, { q: sp.q, page: sp.page ? Number(sp.page) : 1 });
  return (
    <CustomersView
      rows={data.rows.map((r) => ({ ...r, lastVisit: r.lastVisit ? new Date(r.lastVisit).toISOString() : null, createdAt: r.createdAt.toISOString() }))}
      total={data.total}
      limit={ctx.plan.limits.customers}
      planName={ctx.plan.name}
      q={sp.q ?? ""}
      page={data.page}
      hasMore={data.hasMore}
      timeZone={ctx.organization.timezone}
    />
  );
}

export default function CustomersPage(props: PageProps<"/tableau-de-bord/clients">) {
  return (
    <>
      <PageHeader title="Clients" description="Coordonnées, historique et notes de vos clients." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={props.searchParams as Promise<{ q?: string; page?: string }>} />
      </Suspense>
    </>
  );
}
