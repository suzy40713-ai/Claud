"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAccountOrThrow } from "@/lib/account";
import { UserFacingError, toActionError, type ActionResult } from "@/lib/errors";
import { getStripe } from "@/lib/stripe";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().trim().max(80),
  marketingOptIn: z.boolean(),
  preferredNiches: z.array(z.string().max(40)).max(14),
});

export async function updateProfile(input: z.infer<typeof profileSchema>): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const data = profileSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.fullName || null, marketing_opt_in: data.marketingOptIn, preferred_niches: data.preferredNiches })
      .eq("id", userId);
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError("updateProfile", error, userId);
  }
}

export async function completeTutorial(preferredNiches?: string[]): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        tutorial_completed: true,
        ...(preferredNiches ? { preferred_niches: preferredNiches.slice(0, 14) } : {}),
      })
      .eq("id", userId);
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError("completeTutorial", error, userId);
  }
}

export async function restartTutorial(): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const supabase = await createClient();
    await supabase.from("profiles").update({ tutorial_completed: false }).eq("id", userId);
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError("restartTutorial", error, userId);
  }
}

/**
 * GDPR right to erasure. Cancels any Stripe subscription immediately, then
 * deletes the auth user (all personal rows cascade). Invoices remain in
 * Stripe as required by accounting law.
 */
export async function deleteAccount(confirmation: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    if (confirmation.trim().toUpperCase() !== "SUPPRIMER") {
      throw new UserFacingError("Tape SUPPRIMER pour confirmer la suppression définitive.");
    }
    const stripe = getStripe();
    const sub = account.subscription;
    if (stripe && sub?.stripe_subscription_id && ["active", "trialing", "past_due"].includes(sub.status)) {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    }
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(account.user.id);
    if (error) throw error;
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    return toActionError("deleteAccount", error, userId);
  }
  redirect("/?account=deleted");
}
