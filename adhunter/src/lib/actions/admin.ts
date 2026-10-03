"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccount } from "@/lib/account";
import { UserFacingError, toActionError, type ActionResult } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/server";

/** Every admin action re-checks the role server-side. */
async function requireAdminAction() {
  const account = await getAccount();
  if (!account?.isAdmin) throw new UserFacingError("Accès réservé aux administrateurs.", "forbidden");
  return account;
}

export async function setUserRole(userId: string, role: "user" | "admin"): Promise<ActionResult> {
  try {
    const me = await requireAdminAction();
    const id = z.string().uuid().parse(userId);
    if (id === me.user.id && role !== "admin") throw new UserFacingError("Tu ne peux pas retirer ton propre rôle administrateur.");
    const { error } = await createAdminClient().from("profiles").update({ role: z.enum(["user", "admin"]).parse(role) }).eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    return toActionError("admin:setUserRole", error);
  }
}

/** Grants a plan manually (support, partners, tests). Never overrides an active Stripe subscription. */
export async function setManualPlan(userId: string, plan: "free" | "pro" | "business", until?: string | null): Promise<ActionResult> {
  try {
    await requireAdminAction();
    const id = z.string().uuid().parse(userId);
    const target = z.enum(["free", "pro", "business"]).parse(plan);
    const admin = createAdminClient();
    const { data: existing } = await admin.from("subscriptions").select("*").eq("user_id", id).maybeSingle();
    if (existing?.source === "stripe" && existing.stripe_subscription_id && ["active", "trialing", "past_due"].includes(existing.status)) {
      throw new UserFacingError("Cet utilisateur a un abonnement Stripe actif : gère-le depuis Stripe.");
    }
    const { error } = await admin.from("subscriptions").upsert({
      user_id: id,
      stripe_customer_id: existing?.stripe_customer_id ?? null,
      plan: target,
      status: target === "free" ? "inactive" : "active",
      source: "manual",
      current_period_end: until ? new Date(until).toISOString() : null,
      cancel_at_period_end: false,
    });
    if (error) throw error;
    revalidatePath("/admin/users");
    revalidatePath("/admin/subscriptions");
    return { ok: true };
  } catch (error) {
    return toActionError("admin:setManualPlan", error);
  }
}

const limitsSchema = z.object({
  searches_per_month: z.number().int().min(-1),
  ai_analyses_per_month: z.number().int().min(-1),
  ai_creations_per_month: z.number().int().min(-1),
  collections_max: z.number().int().min(-1),
  results_per_search: z.number().int().min(1).max(50),
  exports_per_month: z.number().int().min(-1),
});

const planSchema = z.object({
  name: z.string().trim().min(1).max(40),
  price_cents: z.number().int().min(0),
  stripe_price_id: z.string().trim().max(100).nullable(),
  limits: limitsSchema,
  features: z.array(z.enum(["ad_creator", "search_history", "trend_radar", "teams", "exports", "advanced_search"])),
  is_active: z.boolean(),
});

export async function updatePlan(planId: string, input: z.infer<typeof planSchema>): Promise<ActionResult> {
  try {
    await requireAdminAction();
    const id = z.enum(["free", "pro", "business"]).parse(planId);
    const parsed = planSchema.safeParse(input);
    if (!parsed.success) throw new UserFacingError("Valeurs invalides : " + parsed.error.issues.map((i) => i.path.join(".")).join(", "));
    const { error } = await createAdminClient()
      .from("plans")
      .update({ ...parsed.data, stripe_price_id: parsed.data.stripe_price_id || null })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/plans");
    revalidatePath("/tarifs");
    return { ok: true };
  } catch (error) {
    return toActionError("admin:updatePlan", error);
  }
}

export async function setFeatureFlag(key: string, enabled: boolean): Promise<ActionResult> {
  try {
    await requireAdminAction();
    const { error } = await createAdminClient().from("feature_flags").update({ enabled }).eq("key", z.string().max(60).parse(key));
    if (error) throw error;
    revalidatePath("/admin/features");
    return { ok: true };
  } catch (error) {
    return toActionError("admin:setFeatureFlag", error);
  }
}

export async function resolveError(id: number, resolved = true): Promise<ActionResult> {
  try {
    await requireAdminAction();
    const { error } = await createAdminClient().from("app_errors").update({ resolved }).eq("id", z.number().int().parse(id));
    if (error) throw error;
    revalidatePath("/admin/errors");
    return { ok: true };
  } catch (error) {
    return toActionError("admin:resolveError", error);
  }
}

export async function purgeResolvedErrors(): Promise<ActionResult> {
  try {
    await requireAdminAction();
    const { error } = await createAdminClient().from("app_errors").delete().eq("resolved", true);
    if (error) throw error;
    revalidatePath("/admin/errors");
    return { ok: true };
  } catch (error) {
    return toActionError("admin:purgeResolvedErrors", error);
  }
}
