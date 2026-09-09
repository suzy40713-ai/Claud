import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { IdeaGenerator } from "@/components/dashboard/idea-generator";
import type { Profile } from "@/lib/supabase/types";

export default async function DashboardPage() {
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
  const displayName = (profile as Profile | null)?.full_name?.split(" ")[0] || "";

  return (
    <IdeaGenerator
      canGenerateScript={plan.hasScriptGeneration}
      canGenerateVariants={plan.hasVariants}
      userName={displayName}
    />
  );
}
