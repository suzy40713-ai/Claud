import type { Metadata } from "next";
import { Suspense } from "react";
import { Building2, Globe, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PREFERRED_TIMEZONES } from "@/domain/organization/timezones";
import { env } from "@/lib/env";
import { requireOrganization } from "@/server/auth/session";

export const metadata: Metadata = { title: "Tableau de bord" };

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

async function Overview() {
  const { session, organization } = await requireOrganization();
  const firstName = session.user.name.split(/\s+/)[0];
  const tzLabel =
    PREFERRED_TIMEZONES.find((t) => t.value === organization.timezone)?.label ??
    organization.timezone;
  const publicUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, "")}/${organization.slug}`;

  const rows = [
    { icon: Building2, label: "Entreprise", value: organization.name },
    { icon: Globe, label: "Adresse de réservation", value: publicUrl, mono: true },
    { icon: Clock, label: "Fuseau horaire", value: tzLabel },
    {
      icon: ShieldCheck,
      label: "Votre rôle",
      value: ROLE_LABELS[organization.role] ?? organization.role,
    },
  ];

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bonjour {firstName}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Voici l&apos;essentiel de votre espace BookSync.
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Votre entreprise</CardTitle>
            <Badge variant="success">Compte actif</Badge>
          </div>
          <CardDescription>Informations utilisées sur votre page de réservation.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y rounded-lg border">
            {rows.map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-3 sm:items-center">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground sm:mt-0"
                  aria-hidden
                />
                <div className="grid min-w-0 flex-1 gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-[13px] text-muted-foreground sm:text-sm">{label}</dt>
                  <dd
                    className={
                      mono ? "font-mono text-[13px] break-all" : "truncate text-sm font-medium"
                    }
                  >
                    {value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-80 max-w-2xl animate-pulse rounded-xl bg-muted" />}>
      <Overview />
    </Suspense>
  );
}
