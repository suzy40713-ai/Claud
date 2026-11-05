import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsSection } from "@/components/settings/section";
import { requirePermission } from "@/server/auth/session";
import { getOrganizationHours, listTimeOff } from "@/server/catalog/staff";
import { OrgHoursClient } from "./org-hours-client";

export const metadata: Metadata = { title: "Horaires et fermetures — Paramètres" };

async function Content() {
  const ctx = await requirePermission("closures.manage");
  const [week, closures] = await Promise.all([
    getOrganizationHours(ctx.organization.id),
    listTimeOff(ctx.organization.id, null),
  ]);
  return (
    <div className="grid gap-8">
      <SettingsSection
        title="Horaires d'ouverture"
        description="Affichés sur votre page de réservation et proposés par défaut aux nouveaux employés. Les créneaux réservables dépendent des horaires de chaque employé."
      >
        <OrgHoursClient kind="hours" week={week} />
      </SettingsSection>
      <SettingsSection
        title="Jours de fermeture"
        description="Congés annuels, jours fériés… Aucun rendez-vous ne pourra être pris pendant ces périodes, pour toute l'équipe."
      >
        <OrgHoursClient
          kind="closures"
          timeZone={ctx.organization.timezone}
          closures={closures.map((c) => ({
            id: c.id,
            startsAt: c.startsAt.toISOString(),
            endsAt: c.endsAt.toISOString(),
            reason: c.reason,
          }))}
        />
      </SettingsSection>
    </div>
  );
}

export default function HoursSettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <Content />
    </Suspense>
  );
}
