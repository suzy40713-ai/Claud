import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CreationView } from "@/components/ai/creation-view";
import { DeleteCreationButton } from "@/components/ai/delete-creation-button";
import { requireAccount } from "@/lib/account";
import type { AdCreation } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Création" };

export default async function CreationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await requireAccount(`/app/creator/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("ai_creations").select("*").eq("id", id).eq("user_id", account.user.id).maybeSingle();
  if (!data) notFound();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/creator" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Ad Creator
        </Link>
        <DeleteCreationButton id={data.id} />
      </div>
      <CreationView id={data.id} title={data.title} initial={data.result as AdCreation} isDemo={data.is_demo} />
    </div>
  );
}
