import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

export interface ReportWithProduct extends Tables<"marketing_reports"> {
  product: Tables<"products"> | null;
}

async function attachProduct(
  supabase: TypedClient,
  report: Tables<"marketing_reports"> | null
): Promise<ReportWithProduct | null> {
  if (!report) return null;
  const { data: product } = await supabase.from("products").select("*").eq("id", report.product_id).maybeSingle();
  return { ...report, product: product ?? null };
}

/**
 * The dashboard is organised around a user's most recently generated
 * report — every strategy/content/calendar page reads from it. Users can
 * hold several products/reports (see /dashboard/produit), but only the
 * latest one drives the main navigation, matching the single active plan
 * users interact with day to day.
 */
export async function getLatestReport(supabase: TypedClient, userId: string) {
  const { data } = await supabase
    .from("marketing_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return attachProduct(supabase, data);
}

export async function getReportBundle(supabase: TypedClient, reportId: string, userId: string) {
  const [reportRes, persona, positioning, offer, acquisition, contentIdeas, calendar, progress, firstCustomer, emails, ads] =
    await Promise.all([
      supabase.from("marketing_reports").select("*").eq("id", reportId).eq("user_id", userId).maybeSingle(),
      supabase.from("personas").select("*").eq("report_id", reportId).maybeSingle(),
      supabase.from("positioning").select("*").eq("report_id", reportId).maybeSingle(),
      supabase.from("offers").select("*").eq("report_id", reportId).maybeSingle(),
      supabase.from("acquisition_strategies").select("*").eq("report_id", reportId),
      supabase.from("content_ideas").select("*").eq("report_id", reportId).order("idx"),
      supabase.from("action_plans").select("*").eq("report_id", reportId).order("day_number"),
      supabase.from("action_progress").select("*").eq("user_id", userId),
      supabase.from("first_customer_actions").select("*").eq("report_id", reportId).order("sort_order"),
      supabase.from("emails").select("*").eq("report_id", reportId),
      supabase.from("ads").select("*").eq("report_id", reportId),
    ]);

  const report = await attachProduct(supabase, reportRes.data);

  return {
    report,
    persona: persona.data,
    positioning: positioning.data,
    offer: offer.data,
    acquisitionStrategies: acquisition.data ?? [],
    contentIdeas: contentIdeas.data ?? [],
    calendar: calendar.data ?? [],
    progress: progress.data ?? [],
    firstCustomerActions: firstCustomer.data ?? [],
    emails: emails.data ?? [],
    ads: ads.data ?? [],
  };
}

export async function listReports(supabase: TypedClient, userId: string) {
  const { data } = await supabase
    .from("marketing_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  const productIds = Array.from(new Set(data.map((r) => r.product_id)));
  const { data: products } = await supabase.from("products").select("id, name").in("id", productIds);
  const productMap = new Map((products ?? []).map((p) => [p.id, p.name]));

  return data.map((r) => ({ ...r, productName: productMap.get(r.product_id) ?? "Produit supprimé" }));
}
