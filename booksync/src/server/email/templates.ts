/**
 * Modèles d'emails BookSync (HTML compatible clients mail + version texte).
 * Fonctions pures : testables sans base ni réseau.
 */

export type RenderedEmail = { template: string; subject: string; html: string; text: string };

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout({ preheader, body }: { preheader: string; body: string }) {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BookSync</title></head>
<body style="margin:0;background:#f6f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d27;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
<tr><td style="padding:0 4px 20px;font-weight:600;font-size:17px;letter-spacing:-0.01em;">
<span style="display:inline-block;width:22px;height:22px;border-radius:6px;background:#4f46e5;vertical-align:-5px;margin-right:8px;"></span>BookSync
</td></tr>
<tr><td style="background:#ffffff;border:1px solid #e6e6ee;border-radius:12px;padding:32px 28px;">${body}</td></tr>
<tr><td style="padding:20px 4px;font-size:12px;line-height:18px;color:#7a7a8c;">
Vous recevez cet email car une action a été effectuée sur votre compte BookSync.
Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(url: string, label: string) {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px;">${escapeHtml(label)}</a>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#3b3b4a;">${text}</p>`;
}

function fallbackLink(url: string) {
  return `<p style="margin:24px 0 0;font-size:12px;line-height:18px;color:#7a7a8c;">Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :<br><a href="${escapeHtml(url)}" style="color:#4f46e5;word-break:break-all;">${escapeHtml(url)}</a></p>`;
}

export function verifyEmailTemplate({ name, url }: { name: string; url: string }): RenderedEmail {
  const firstName = name.trim().split(/\s+/)[0] || "";
  const subject = "Confirmez votre adresse email";
  const html = layout({
    preheader: "Un dernier clic pour activer votre compte BookSync.",
    body: [
      `<h1 style="margin:0 0 16px;font-size:20px;line-height:28px;">Bienvenue${firstName ? ` ${escapeHtml(firstName)}` : ""} 👋</h1>`,
      paragraph("Confirmez votre adresse email pour activer votre compte BookSync."),
      `<p style="margin:24px 0;">${button(url, "Confirmer mon adresse")}</p>`,
      paragraph("Ce lien est valable 24 heures."),
      fallbackLink(url),
    ].join(""),
  });
  const text = `Bienvenue${firstName ? ` ${firstName}` : ""},

Confirmez votre adresse email pour activer votre compte BookSync :
${url}

Ce lien est valable 24 heures.
Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.`;
  return { template: "verify-email", subject, html, text };
}

export function resetPasswordTemplate({ name, url }: { name: string; url: string }): RenderedEmail {
  const firstName = name.trim().split(/\s+/)[0] || "";
  const subject = "Réinitialisation de votre mot de passe";
  const html = layout({
    preheader: "Choisissez un nouveau mot de passe pour votre compte BookSync.",
    body: [
      `<h1 style="margin:0 0 16px;font-size:20px;line-height:28px;">Nouveau mot de passe</h1>`,
      paragraph(
        `Bonjour${firstName ? ` ${escapeHtml(firstName)}` : ""}, vous avez demandé à réinitialiser le mot de passe de votre compte BookSync.`,
      ),
      `<p style="margin:24px 0;">${button(url, "Choisir un nouveau mot de passe")}</p>`,
      paragraph(
        "Ce lien est valable 1 heure. Si vous n'avez rien demandé, votre mot de passe actuel reste inchangé.",
      ),
      fallbackLink(url),
    ].join(""),
  });
  const text = `Bonjour${firstName ? ` ${firstName}` : ""},

Vous avez demandé à réinitialiser le mot de passe de votre compte BookSync :
${url}

Ce lien est valable 1 heure. Si vous n'avez rien demandé, ignorez ce message.`;
  return { template: "reset-password", subject, html, text };
}

export function existingAccountTemplate({
  name,
  signInUrl,
  resetUrl,
}: {
  name: string;
  signInUrl: string;
  resetUrl: string;
}): RenderedEmail {
  const firstName = name.trim().split(/\s+/)[0] || "";
  const subject = "Vous avez déjà un compte BookSync";
  const html = layout({
    preheader: "Une inscription a été tentée avec votre adresse email.",
    body: [
      `<h1 style="margin:0 0 16px;font-size:20px;line-height:28px;">Vous avez déjà un compte</h1>`,
      paragraph(
        `Bonjour${firstName ? ` ${escapeHtml(firstName)}` : ""}, quelqu'un (probablement vous) a essayé de créer un compte BookSync avec cette adresse email. Elle est déjà associée à un compte.`,
      ),
      `<p style="margin:24px 0;">${button(signInUrl, "Me connecter")}</p>`,
      paragraph(
        `Mot de passe oublié ? <a href="${escapeHtml(resetUrl)}" style="color:#4f46e5;">Choisissez-en un nouveau</a>.`,
      ),
    ].join(""),
  });
  const text = `Bonjour${firstName ? ` ${firstName}` : ""},

Quelqu'un (probablement vous) a essayé de créer un compte BookSync avec cette adresse email, qui est déjà associée à un compte.

Se connecter : ${signInUrl}
Mot de passe oublié : ${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre compte reste protégé.`;
  return { template: "existing-account", subject, html, text };
}
