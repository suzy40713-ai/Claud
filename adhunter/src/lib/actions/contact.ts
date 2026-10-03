"use server";

import { z } from "zod";

import { getAccount } from "@/lib/account";
import { integrations } from "@/lib/env";
import { toActionError, UserFacingError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/server";

export interface ContactState {
  error?: string;
  success?: string;
}

const schema = z.object({
  name: z.string().trim().min(2, "Indique ton nom.").max(80),
  email: z.string().trim().email("Adresse email invalide.").max(160),
  subject: z.string().trim().min(3, "Précise l'objet de ton message.").max(120),
  message: z.string().trim().min(10, "Ton message est un peu court.").max(4000),
  consent: z.literal("on", { message: "Merci d'accepter le traitement de tes données pour te répondre." }),
});

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot field: bots fill it, humans never see it.
  if (formData.get("website")) return { success: "Merci, ton message a bien été envoyé." };
  try {
    if (!integrations.supabase() || !integrations.supabaseAdmin()) {
      throw new UserFacingError("Le formulaire de contact n'est pas encore configuré. Écris-nous directement par email.");
    }
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const account = await getAccount();
    const { consent: _consent, ...data } = parsed.data;
    void _consent;
    const { error } = await createAdminClient().from("contact_messages").insert({ ...data, user_id: account?.user.id ?? null });
    if (error) throw error;
    return { success: "Merci, ton message a bien été envoyé. Nous te répondons sous 2 jours ouvrés." };
  } catch (error) {
    const res = await toActionError("contact", error);
    return { error: res.error };
  }
}
