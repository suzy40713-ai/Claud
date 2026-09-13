"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { consumeGenerationCredit } from "@/lib/credits";
import { generateMarketingPlan, GenerationError } from "@/lib/ai/generate";
import type { GenerationOutput } from "@/lib/ai/schema";

export interface GenerationResult {
  success: boolean;
  reportId?: string;
  error?: string;
  errorCode?: "no_credit";
}

export async function generatePlanForProduct(productId: string): Promise<GenerationResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu dois être connecté(e) pour générer un plan." };
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", user.id)
    .single();

  if (productError || !product) {
    return { success: false, error: "Produit introuvable." };
  }

  const hasCredit = await consumeGenerationCredit(user.id);
  if (!hasCredit) {
    return {
      success: false,
      errorCode: "no_credit",
      error: "Il te faut un crédit pour générer ce plan. Achète un plan pour 14,99€.",
    };
  }

  let plan: GenerationOutput;
  try {
    plan = await generateMarketingPlan(product);
  } catch (error) {
    const message = error instanceof GenerationError ? error.message : "Une erreur inattendue est survenue.";
    return { success: false, error: message };
  }

  const { data: report, error: reportError } = await supabase
    .from("marketing_reports")
    .insert({
      user_id: user.id,
      product_id: product.id,
      score: plan.score,
      positioning_score: plan.subscores.find((s) => s.axis === "positioning")?.score ?? 0,
      offer_score: plan.subscores.find((s) => s.axis === "offer")?.score ?? 0,
      acquisition_score: plan.subscores.find((s) => s.axis === "acquisition")?.score ?? 0,
      content_score: plan.subscores.find((s) => s.axis === "content")?.score ?? 0,
      conversion_score: plan.subscores.find((s) => s.axis === "conversion")?.score ?? 0,
      social_proof_score: plan.subscores.find((s) => s.axis === "social_proof")?.score ?? 0,
      subscore_details: plan.subscores,
      summary: plan.summary,
      status: "completed",
      raw_ai_response: plan,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return { success: false, error: "Impossible d'enregistrer le rapport généré." };
  }

  const reportId = report.id;
  const base = { user_id: user.id, report_id: reportId, product_id: product.id };

  // Sequential inserts rather than a single DB transaction: acceptable for
  // an MVP (Supabase JS has no client-side multi-table transaction API
  // without a custom Postgres RPC). A partially-written report is rare and
  // non-destructive — the report row always lands first and the UI treats
  // missing child sections as empty states rather than crashing.
  await Promise.all([
    supabase.from("personas").insert({ ...base, ...plan.persona, is_hypothesis: true }),
    supabase.from("positioning").insert({ ...base, ...plan.positioning }),
    supabase.from("offers").insert({ ...base, ...plan.offer }),
    supabase
      .from("acquisition_strategies")
      .insert(plan.acquisition_strategies.map((s) => ({ ...base, ...s }))),
    supabase
      .from("content_ideas")
      .insert(plan.content_ideas.map((c, idx) => ({ ...base, ...c, idx: idx + 1 }))),
    supabase.from("action_plans").insert(plan.calendar.map((d) => ({ ...base, ...d }))),
    supabase.from("emails").insert(plan.emails.map((e) => ({ ...base, ...e }))),
    supabase.from("ads").insert(plan.ads.map((a) => ({ ...base, ...a }))),
    supabase.from("first_customer_actions").insert([
      ...plan.first_customer_actions.today.map((action, i) => ({
        ...base,
        timeframe: "today" as const,
        action,
        sort_order: i,
      })),
      ...plan.first_customer_actions.week.map((action, i) => ({
        ...base,
        timeframe: "week" as const,
        action,
        sort_order: i,
      })),
      ...plan.first_customer_actions.month.map((action, i) => ({
        ...base,
        timeframe: "month" as const,
        action,
        sort_order: i,
      })),
    ]),
  ]);

  await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);

  revalidatePath("/dashboard");

  return { success: true, reportId };
}
