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

  const [{ data: profile }, credits, { data: purchases }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getCreditStatus(user.id),
    supabase
      .from("credit_purchases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader title="Paramètres" description="Ton profil, ton produit, tes préférences et tes crédits." />
      <Suspense>
        <SettingsTabs
          email={user.email ?? ""}
          fullName={profile?.full_name ?? null}
          creditsBalance={credits.balance}
          purchases={purchases ?? []}
        />
      </Suspense>
    </div>
  );
}
