import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard — TikTok Shop Analytics",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
      <p className="mt-2 text-neutral-600">
        Connecté en tant que {user?.email}. La marge nette globale, le
        graphique d&apos;évolution et le tableau produits arrivent à
        l&apos;étape 4.
      </p>
    </div>
  );
}
