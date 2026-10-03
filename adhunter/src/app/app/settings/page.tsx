import Link from "next/link";
import { Download } from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/forms";

import { PageHeader } from "@/components/app/ui-bits";
import { DeleteAccountDialog, ProfileForm, RestartTutorialButton } from "@/components/settings/settings-forms";
import { Button } from "@/components/ui/button";
import { requireAccount } from "@/lib/account";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Paramètres" };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="surface grid gap-6 p-6 md:grid-cols-[240px_1fr]">
      <div>
        <h2 className="font-medium">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const account = await requireAccount("/app/settings");
  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Ton profil, ta sécurité et tes données personnelles." />
      <Section title="Profil" description={`Email : ${account.user.email} · membre depuis le ${formatDate(account.profile.created_at)}`}>
        <ProfileForm fullName={account.profile.full_name ?? ""} marketingOptIn={account.profile.marketing_opt_in} preferredNiches={account.profile.preferred_niches} />
      </Section>
      <Section title="Mot de passe" description="Choisis un nouveau mot de passe d'au moins 8 caractères.">
        <div className="max-w-sm"><ResetPasswordForm /></div>
      </Section>
      <Section title="Aide" description="Besoin d'un rappel sur le fonctionnement d'AdHunter ?">
        <RestartTutorialButton />
      </Section>
      <Section title="Mes données (RGPD)" description="Exporte toutes tes données ou supprime définitivement ton compte.">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><a href="/api/export/account"><Download /> Exporter mes données (JSON)</a></Button>
          <DeleteAccountDialog />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Voir notre <Link href="/legal/confidentialite" className="underline">politique de confidentialité</Link>.</p>
      </Section>
    </div>
  );
}
