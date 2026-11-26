import "server-only";
import { env } from "./env";

/** Envoi d'un email via Resend ; sans clé, journalise seulement. Ne lève jamais d'erreur. */
export async function sendEmail(to: string, subject: string, text: string, html: string) {
  const e = env();
  if (!e.RESEND_API_KEY) {
    console.info(`[vidaia] email non envoyé (pas de clé) → ${to} : ${subject}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: e.EMAIL_FROM, to, subject, text, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("[vidaia] Resend HTTP", res.status);
    return res.ok;
  } catch (error) {
    console.error("[vidaia] email en échec", error);
    return false;
  }
}

export function accessEmail(link: string) {
  const subject = "Votre accès VidaIA";
  const text = `Bonjour,\n\nVoici votre lien d'accès à VidaIA (valable 7 jours) :\n${link}\n\nVos crédits restent sur votre compte : vous pouvez redemander un lien à tout moment depuis la page Connexion.\n\nVidaIA`;
  const html = `<p>Bonjour,</p><p>Voici votre lien d'accès à VidaIA (valable 7 jours) :</p><p><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ouvrir mon studio</a></p><p style="color:#666;font-size:13px">Vos crédits restent sur votre compte : vous pouvez redemander un lien à tout moment depuis la page Connexion.</p>`;
  return { subject, text, html };
}
