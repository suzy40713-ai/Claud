import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { activityLabel, ACTIVITIES } from "@/domain/activities";
import { env } from "@/lib/env";
import { requirePermission } from "@/server/auth/session";
import { getOrganizationHours } from "@/server/catalog/staff";
import { getSetupProgress } from "@/server/onboarding";
import { SetupWizard } from "./setup-wizard";

export const metadata: Metadata = { title: "Installation" };

async function Content() {
  const ctx = await requirePermission("organization.update");
  const [progress, week] = await Promise.all([
    getSetupProgress(ctx),
    getOrganizationHours(ctx.organization.id),
  ]);
  const activity = ACTIVITIES.find((a) => a.value === ctx.organization.activity);
  return (
    <SetupWizard
      steps={progress.steps}
      week={week}
      activityLabel={activityLabel(ctx.organization.activity) ?? "votre activité"}
      suggestions={(activity?.examples ?? []).map(([name]) => name)}
      publicUrl={`${env.NEXT_PUBLIC_APP_URL}/${ctx.organization.slug}`}
    />
  );
}

export default function SetupPage() {
  return (
    <>
      <PageHeader
        title="Bienvenue sur BookSync 🎉"
        description="Quelques minutes suffisent pour ouvrir votre page de réservation."
      />
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <Content />
      </Suspense>
    </>
  );
}
