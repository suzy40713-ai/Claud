import { createClient } from "@/lib/supabase/server";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import type { Profile } from "@/lib/supabase/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return <SettingsPanel profile={profile as Profile} />;
}
