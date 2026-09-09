import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { SavedIdeas } from "@/components/dashboard/saved-ideas";
import type { Profile } from "@/lib/supabase/types";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const plan = getPlan((profile as Profile | null)?.plan ?? "free");

  return (
    <SavedIdeas canGenerateScript={plan.hasScriptGeneration} canGenerateVariants={plan.hasVariants} />
  );
}
