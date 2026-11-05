import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { can } from "@/domain/permissions";
import { requireOrg } from "@/server/auth/session";
import { SettingsTabs } from "./settings-tabs";

export const SETTINGS_TABS = [
  {
    href: "/tableau-de-bord/parametres/entreprise",
    label: "Entreprise",
    permission: "organization.update",
  },
  {
    href: "/tableau-de-bord/parametres/reservation",
    label: "Réservation en ligne",
    permission: "organization.update",
  },
  {
    href: "/tableau-de-bord/parametres/horaires",
    label: "Horaires et fermetures",
    permission: "closures.manage",
  },
  {
    href: "/tableau-de-bord/parametres/notifications",
    label: "Notifications",
    permission: "notifications.settings",
  },
  { href: "/tableau-de-bord/parametres/compte", label: "Mon compte", permission: null },
] as const;

async function Tabs() {
  const ctx = await requireOrg();
  return (
    <SettingsTabs
      tabs={SETTINGS_TABS.filter((t) => !t.permission || can(ctx.role, t.permission))}
    />
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Votre entreprise, votre page de réservation et votre compte."
      />
      <Suspense fallback={<div className="mb-6 h-10" />}>
        <Tabs />
      </Suspense>
      {children}
    </>
  );
}
