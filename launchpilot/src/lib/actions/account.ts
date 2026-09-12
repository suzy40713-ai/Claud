"use server";

import { redirect } from "next/navigation";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface AccountActionResult {
  success: boolean;
  error?: string;
}

export async function updateProfile(input: { fullName: string }): Promise<AccountActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName.trim() || null })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Impossible de mettre à jour ton profil." };
  }

  return { success: true };
}

export async function updateThemePreference(theme: "system" | "light" | "dark"): Promise<AccountActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  await supabase.from("profiles").update({ theme_preference: theme }).eq("id", user.id);
  return { success: true };
}

/**
 * Permanently deletes the current user's account and all associated data.
 * Relies on `on delete cascade` foreign keys (see migration 0001) so every
 * product/report/content row disappears with the auth user in one step.
 */
export async function deleteAccount(): Promise<AccountActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { success: false, error: "Impossible de supprimer le compte. Réessaie ou contacte le support." };
  }

  await supabase.auth.signOut();
  redirect("/");
}
