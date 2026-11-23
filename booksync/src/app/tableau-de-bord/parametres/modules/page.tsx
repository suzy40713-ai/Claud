import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";
import { ModulesForm } from "./modules-form";

export const metadata: Metadata = { title: "Modules — Paramètres" };

async function Content() {
  const ctx = await requirePermission("organization.update");
  return <ModulesForm bookingModule={ctx.organization.bookingModule} />;
}

export default function ModulesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-32" />}>
      <Content />
    </Suspense>
  );
}
