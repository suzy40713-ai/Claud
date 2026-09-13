import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/credits";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, credits] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getCreditStatus(user.id),
  ]);

  return (
    <DashboardShell userEmail={user.email ?? ""} userName={profile?.full_name ?? null} creditsBalance={credits.balance}>
      {children}
    </DashboardShell>
  );
}
