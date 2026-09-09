import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { ContentCalendar } from "@/components/dashboard/content-calendar";
import type { Profile } from "@/lib/supabase/types";

export default async function CalendarPage() {
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

  return <ContentCalendar canUseCalendar={plan.hasCalendar} />;
}
