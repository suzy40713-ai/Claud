import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { emailMessage } from "@/db/schema";
import { env } from "@/lib/env";
import type { RenderedEmail } from "./templates";

export type SendResult = { id: string; status: "sent" | "failed" | "logged" };

/**
 * Envoie un email transactionnel.
 * Chaque envoi est d'abord enregistré (outbox), puis transmis au fournisseur.
 * Sans RESEND_API_KEY, l'email est seulement journalisé (statut `logged`).
 * Ne lève jamais d'erreur : un échec d'envoi ne doit pas casser le parcours utilisateur.
 */
export async function sendEmail(to: string, email: RenderedEmail): Promise<SendResult> {
  const [row] = await db
    .insert(emailMessage)
    .values({
      to,
      subject: email.subject,
      template: email.template,
      html: email.html,
      text: email.text,
    })
    .returning({ id: emailMessage.id });

  if (!env.RESEND_API_KEY) {
    await db
      .update(emailMessage)
      .set({ status: "logged", provider: "log" })
      .where(eq(emailMessage.id, row.id));
    if (env.NODE_ENV !== "test") {
      console.info(`[email] (non envoyé, aucun fournisseur) → ${to} : ${email.subject}`);
    }
    return { id: row.id, status: "logged" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(body.message ?? `Resend a répondu ${res.status}`);
    await db
      .update(emailMessage)
      .set({
        status: "sent",
        provider: "resend",
        providerMessageId: body.id ?? null,
        sentAt: new Date(),
      })
      .where(eq(emailMessage.id, row.id));
    return { id: row.id, status: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email] échec d'envoi → ${to} : ${message}`);
    await db
      .update(emailMessage)
      .set({ status: "failed", provider: "resend", error: message })
      .where(eq(emailMessage.id, row.id));
    return { id: row.id, status: "failed" };
  }
}
