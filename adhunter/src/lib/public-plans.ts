import "server-only";

import { createClient } from "@supabase/supabase-js";

import { integrations } from "@/lib/env";
import { DEFAULT_PLANS, mergePlan, type PlanDefinition } from "@/lib/plans";
import type { Database, PlanId } from "@/types/database";

/** Cookie-less read of the plans table, so marketing pages stay static (ISR). */
export async function getPublicPlans(): Promise<Record<PlanId, PlanDefinition>> {
  if (!integrations.supabase()) return DEFAULT_PLANS;
  try {
    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data } = await supabase.from("plans").select("*");
    const rows = new Map((data ?? []).map((r) => [r.id, r]));
    return {
      free: mergePlan(DEFAULT_PLANS.free, rows.get("free")),
      pro: mergePlan(DEFAULT_PLANS.pro, rows.get("pro")),
      business: mergePlan(DEFAULT_PLANS.business, rows.get("business")),
    };
  } catch {
    return DEFAULT_PLANS;
  }
}
