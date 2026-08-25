import { readFile } from "node:fs/promises";
import { Resend } from "resend";
import { env } from "./env.js";

let resendClient: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(env.resendApiKey);
}

function getResend(): Resend {
  if (!env.resendApiKey) {
    throw Object.assign(new Error("RESEND_API_KEY non configure : l'envoi d'email est indisponible."), {
      statusCode: 503,
    });
  }
  if (!resendClient) {
    resendClient = new Resend(env.resendApiKey);
  }
  return resendClient;
}

export async function sendPurchaseEmail(
  toEmail: string,
  opts: { subject: string; introHtml: string; pdfPath: string; downloadFilename: string }
): Promise<void> {
  const resend = getResend();
  const pdfBuffer = await readFile(opts.pdfPath);

  const { error } = await resend.emails.send({
    from: env.ebookSenderEmail,
    to: toEmail,
    subject: opts.subject,
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1c1c22;">
        <p style="font-size: 22px; margin-bottom: 4px;">👑 <strong>Cadenzo</strong></p>
        ${opts.introHtml}
        <p style="margin-top: 24px;">On croit en toi. Bonne transformation.</p>
        <p style="color:#6a6680;">&mdash; L'equipe Cadenzo</p>
      </div>
    `,
    attachments: [
      {
        filename: opts.downloadFilename,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`Echec de l'envoi de l'email Resend: ${error.message}`);
  }
}

export async function sendLeadMagnetEmail(toEmail: string): Promise<void> {
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: env.ebookSenderEmail,
    to: toEmail,
    subject: "Ton mini-guide gratuit Cadenzo 👑",
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1c1c22;">
        <p style="font-size: 22px; margin-bottom: 4px;">👑 <strong>Cadenzo</strong></p>
        <h1 style="font-size: 20px; color: #14121f;">Voici tes 3 leviers pour debloquer ta progression</h1>
        <p>Merci de t'etre inscrite. En attendant d'aller plus loin, voici trois choses simples a appliquer des cette semaine :</p>
        <ol style="padding-left: 20px; line-height: 1.7;">
          <li><strong>Le sommeil avant le volume.</strong> En dessous de 7h de sommeil regulier, augmenter le nombre de seances n'apporte quasiment aucun benefice supplementaire — le corps ne recupere pas assez pour progresser. Avant d'ajouter une seance, corrige d'abord ca.</li>
          <li><strong>La regularite bat l'intensite.</strong> Trois seances moyennes chaque semaine, tenues sur 10 semaines, produisent plus de resultats qu'une semaine parfaite suivie de deux semaines sautees. Vise un rythme que tu peux tenir meme les semaines difficiles.</li>
          <li><strong>Mesure autre chose que le poids.</strong> Le poids sur la balance varie avec la retention d'eau, le cycle, la digestion — il masque souvent les vrais progres. Prends plutot une photo et un tour de taille toutes les deux semaines : c'est bien plus fiable.</li>
        </ol>
        <p style="margin-top: 20px;">Si tu veux un programme complet (12 semaines, nutrition, suivi pas a pas), l'ebook <strong>Transformation 90 Jours</strong> reprend tout ca en detail : <a href="${env.frontendOrigin}/ebook" style="color: #5b52e0;">${env.frontendOrigin}/ebook</a></p>
        <p style="margin-top: 24px;">Bonne suite dans ta progression.</p>
        <p style="color:#6a6680;">&mdash; L'equipe Cadenzo</p>
        <p style="margin-top: 24px; font-size: 12px; color:#a8a4bd;">Tu recevras 2 emails complementaires dans les jours qui viennent. Tu peux te desinscrire a tout moment en repondant a cet email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Echec de l'envoi de l'email Resend: ${error.message}`);
  }
}

export async function sendLeadNurtureEmailA(toEmail: string): Promise<void> {
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: env.ebookSenderEmail,
    to: toEmail,
    subject: "As-tu eu le temps de lire le guide ? 👑",
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1c1c22;">
        <p style="font-size: 22px; margin-bottom: 4px;">👑 <strong>Cadenzo</strong></p>
        <h1 style="font-size: 20px; color: #14121f;">Petit rappel sur les 3 leviers</h1>
        <p>Il y a quelques jours, tu as recu un mini-guide avec 3 leviers concrets (sommeil, regularite, comment mesurer ta progression). Si tu n'as pas eu le temps de le lire, ce n'est pas grave — le plus important, c'est d'en appliquer un seul cette semaine, pas les trois d'un coup.</p>
        <p style="margin-top: 16px;">Si tu veux aller plus loin avec un plan complet plutot que trois conseils isoles, l'ebook <strong>Transformation 90 Jours</strong> detaille un programme d'entrainement sur 12 semaines, la nutrition et un carnet de suivi : <a href="${env.frontendOrigin}/ebook" style="color: #5b52e0;">${env.frontendOrigin}/ebook</a></p>
        <p style="margin-top: 24px;">Bonne suite dans ta progression.</p>
        <p style="color:#6a6680;">&mdash; L'equipe Cadenzo</p>
        <p style="margin-top: 24px; font-size: 12px; color:#a8a4bd;">Tu recevras encore 1 email apres celui-ci. Tu peux te desinscrire a tout moment en repondant a cet email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Echec de l'envoi de l'email Resend: ${error.message}`);
  }
}

export async function sendLeadNurtureEmailB(toEmail: string): Promise<void> {
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: env.ebookSenderEmail,
    to: toEmail,
    subject: "Un dernier mot avant qu'on se quitte 👑",
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1c1c22;">
        <p style="font-size: 22px; margin-bottom: 4px;">👑 <strong>Cadenzo</strong></p>
        <h1 style="font-size: 20px; color: #14121f;">Si le programme complet est un trop grand pas</h1>
        <p>Un programme complet de 12 semaines n'est pas toujours le bon point de depart. Si tu preferes commencer petit, deux ebooks a 9,99€ couvrent des besoins plus specifiques :</p>
        <ul style="padding-left: 20px; line-height: 1.7;">
          <li><strong>Recettes Regime</strong> — 20 recettes riches en proteines pour manger equilibre pendant une perte de poids</li>
          <li><strong>Bases de la Musculation</strong> — un programme simple de 4 semaines pour bien debuter, sans te blesser</li>
        </ul>
        <p style="margin-top: 12px;">Tu peux voir l'ensemble des ebooks ici : <a href="${env.frontendOrigin}/ebook" style="color: #5b52e0;">${env.frontendOrigin}/ebook</a></p>
        <p style="margin-top: 20px;">C'est le dernier email de cette serie. Si tu as la moindre question, ecris-nous directement a <a href="mailto:suzy40713@gmail.com" style="color: #5b52e0;">suzy40713@gmail.com</a>, on repond personnellement.</p>
        <p style="margin-top: 24px;">Bonne suite dans ta progression.</p>
        <p style="color:#6a6680;">&mdash; L'equipe Cadenzo</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Echec de l'envoi de l'email Resend: ${error.message}`);
  }
}
