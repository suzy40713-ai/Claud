import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";
import { getCustomer } from "@/server/customers/service";
import { NotFoundError } from "@/server/errors";
import { CustomerDetail } from "./customer-detail";

export const metadata: Metadata = { title: "Fiche client" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("customers.view_all");
  let data;
  try {
    data = await getCustomer(ctx, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const c = data.customer;
  return (
    <CustomerDetail
      timeZone={ctx.organization.timezone}
      customer={{ id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email ?? "", phone: c.phone ?? "", notes: c.notes ?? "", emailOptIn: c.emailOptIn, createdAt: c.createdAt.toISOString() }}
      history={data.history.map((h) => ({ ...h, startsAt: h.startsAt.toISOString() }))}
      stats={data.stats}
    />
  );
}

export default function CustomerPage(props: PageProps<"/tableau-de-bord/clients/[id]">) {
  return (
    <>
      <Link href="/tableau-de-bord/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Clients
      </Link>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content params={props.params} />
      </Suspense>
    </>
  );
}
