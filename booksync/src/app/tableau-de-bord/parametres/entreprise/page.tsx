import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/env";
import { fileUrl } from "@/lib/files";
import { requirePermission } from "@/server/auth/session";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Entreprise — Paramètres" };

async function Content() {
  const ctx = await requirePermission("organization.update");
  const o = ctx.organization;
  return (
    <CompanyForm
      publicBaseUrl={env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, "")}
      logoUrl={fileUrl(o.logoFileId)}
      initial={{
        name: o.name,
        slug: o.slug,
        activity: o.activity ?? "autre",
        description: o.description ?? "",
        email: o.email ?? "",
        phone: o.phone ?? "",
        addressLine1: o.addressLine1 ?? "",
        addressLine2: o.addressLine2 ?? "",
        postalCode: o.postalCode ?? "",
        city: o.city ?? "",
        country: o.country,
        timezone: o.timezone,
      }}
    />
  );
}

export default function CompanySettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <Content />
    </Suspense>
  );
}
