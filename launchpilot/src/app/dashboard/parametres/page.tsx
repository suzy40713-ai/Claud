import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { createClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/credits";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, credits] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getCreditStatus(user.id),
  ]);

  return (
    <div>
      <PageHeader title="Paramètres" description="Ton profil, ton produit, tes préférences et ton abonnement." />
      <Suspense>
        <SettingsTabs
          email={user.email ?? ""}
          fullName={profile?.full_name ?? null}
          plan={credits.plan}
          creditsRemaining={credits.remaining}
          creditsLimit={credits.limit}
        />
      </Suspense>
    </div>
  );
}
