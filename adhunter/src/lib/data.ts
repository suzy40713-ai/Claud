import "server-only";

import type { Account } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

/** Favorites + accessible collections, used to render ad cards' actions. */
export async function getAdContext(account: Account, adIds: string[]) {
  const supabase = await createClient();
  const [{ data: saved }, { data: collections }] = await Promise.all([
    adIds.length
      ? supabase.from("saved_ads").select("ad_id").eq("user_id", account.user.id).in("ad_id", adIds)
      : Promise.resolve({ data: [] as { ad_id: string }[] }),
    supabase.from("collections").select("id, name").order("created_at", { ascending: true }),
  ]);
  return {
    savedIds: new Set((saved ?? []).map((s) => s.ad_id)),
    collections: collections ?? [],
  };
}
