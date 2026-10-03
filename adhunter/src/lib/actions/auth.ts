"use server";

import { redirect } from "next/navigation";

import { getFeatureFlags } from "@/lib/account";
import { appUrl, integrations } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

export interface AuthActionState {
  error?: string;
  success?: string;
}

const NOT_CONFIGURED = "L'authentification n'est pas encore configurée sur cette instance (Supabase).";

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "Un compte existe déjà avec cet email. Connecte-toi ou réinitialise ton mot de passe.";
  if (m.includes("rate limit")) return "Trop de tentatives. Patiente quelques minutes avant de réessayer.";
  if (m.includes("weak") || m.includes("password")) return "Ce mot de passe est trop faible. Utilise au moins 8 caractères avec lettres et chiffres.";
  if (m.includes("email not confirmed")) return "Confirme d'abord ton adresse email grâce au lien reçu.";
  return "Une erreur est survenue. Vérifie tes informations et réessaie.";
}

export async function signUp(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!integrations.supabase()) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim().slice(0, 80);
  const terms = formData.get("terms") === "on";
  const marketing = formData.get("marketing") === "on";
  const next = safeRedirectPath(String(formData.get("next") || ""), "/app");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Merci de saisir une adresse email valide." };
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (!terms) return { error: "Tu dois accepter les CGU et la politique de confidentialité pour créer un compte." };

  const flags = await getFeatureFlags();
  if (flags.signups === false) return { error: "Les inscriptions sont temporairement fermées. Réessaie bientôt." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, terms_accepted: "true", marketing_opt_in: marketing },
      emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: friendlyAuthError(error.message) };

  // When email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return { success: "Compte créé ! Clique sur le lien envoyé par email pour activer ton compte." };
  }
  redirect(next);
}

export async function signIn(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!integrations.supabase()) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = safeRedirectPath(String(formData.get("next") || ""), "/app");
  if (!email || !password) return { error: "Merci de renseigner ton email et ton mot de passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: error.message.toLowerCase().includes("email not confirmed")
        ? "Confirme d'abord ton adresse email grâce au lien reçu."
        : "Email ou mot de passe incorrect.",
    };
  }
  redirect(next);
}

export async function signOut() {
  if (integrations.supabase()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function requestPasswordReset(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!integrations.supabase()) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Merci de renseigner ton email." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/auth/callback?next=/reset-password`,
  });
  // Same message whether or not the account exists (no account enumeration).
  return { success: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé." };
}

export async function updatePassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!integrations.supabase()) return { error: NOT_CONFIGURED };
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirmPassword") || "");
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (password !== confirm) return { error: "Les mots de passe ne correspondent pas." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendlyAuthError(error.message) };
  redirect("/app?password=updated");
}
