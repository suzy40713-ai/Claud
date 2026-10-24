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

export async function sendBundleEmail(
  toEmail: string,
  ebooks: { pdfPath: string; downloadFilename: string }[]
): Promise<void> {
  const resend = getResend();
  const attachments = await Promise.all(
    ebooks.map(async (e) => ({ filename: e.downloadFilename, content: await readFile(e.pdfPath) }))
  );

  const { error } = await resend.emails.send({
    from: env.ebookSenderEmail,
    to: toEmail,
    subject: "Ton Pack Complet Cadenzo est arrive 👑",
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1c1c22;">
        <p style="font-size: 22px; margin-bottom: 4px;">👑 <strong>Cadenzo</strong></p>
        <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
        <p>Tes <strong>6 ebooks Cadenzo</strong> sont en pieces jointes de cet email, prets a etre lus des maintenant.</p>
        <p>Ton compte est aussi passe <strong>Premium pour 1 an</strong> : le Coach IA, le scan de plats, la liste de courses generee par IA et le reste des fonctionnalites premium sont deja actifs sur ton compte.</p>
        <p style="margin-top: 24px;">On croit en toi. Bonne transformation.</p>
        <p style="color:#6a6680;">&mdash; L'equipe Cadenzo</p>
      </div>
    `,
    attachments,
  });

  if (error) {
    throw new Error(`Echec de l'envoi de l'email Resend: ${error.message}`);
  }
}

function studioLayout(inner: string): string {
  return `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1d2027;">
        <p style="font-size: 22px; margin-bottom: 4px;"><strong>Studio Cartoon</strong></p>
        ${inner}
      </div>
    `;
}

function studioButton(href: string, label: string): string {
  return `<p style="margin: 20px 0;"><a href="${href}" style="display:inline-block;background:#e0194a;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;">${label}</a></p>`;
}

async function sendStudioEmail(toEmail: string, subject: string, inner: string, attachments?: { filename: string; content: Buffer }[]) {
  const resend = getResend();
  const { error } = await resend.emails.send({ from: env.ebookSenderEmail, to: toEmail, subject, html: studioLayout(inner), attachments });
  if (error) {
    throw new Error(`Echec de l'envoi de l'email Resend: ${error.message}`);
  }
}

export async function sendFormationAccessEmail(
  toEmail: string,
  opts: { accessUrl: string; pdfPath: string; downloadFilename: string }
): Promise<void> {
  const pdf = await readFile(opts.pdfPath);
  await sendStudioEmail(
    toEmail,
    "Ton acces a la formation Studio Cartoon",
    `<h1 style="font-size: 20px;">Merci pour ton achat !</h1>
        <p>Voici ton lien d'acces personnel a la formation. Garde cet email : il te permet d'y revenir quand tu veux.</p>
        ${studioButton(opts.accessUrl, "Ouvrir la formation")}
        <p>Le cahier d'exercices PDF est en piece jointe.</p>
        <p>Pour bien demarrer : bloque une heure par jour pendant 30 jours et suis le planning du module 0.</p>`,
    [{ filename: opts.downloadFilename, content: pdf }]
  );
}

export async function sendLeadMagnetEmail(toEmail: string): Promise<void> {
  await sendStudioEmail(
    toEmail,
    "Ton apercu gratuit de Studio Cartoon",
    `<h1 style="font-size: 20px;">Voici tes deux premiers modules</h1>
        <p>Merci de t'etre inscrit. Ton apercu gratuit contient les deux premiers modules de la formation : comment fonctionnent les sketchs animes, et comment creer le personnage recurrent qui donne envie de s'abonner.</p>
        ${studioButton(`${env.frontendOrigin}/apercu`, "Voir l'apercu gratuit")}
        <p style="margin-top: 24px; font-size: 12px; color:#8a8f99;">Tu recevras 2 emails complementaires dans les jours qui viennent. Tu peux te desinscrire a tout moment en repondant a cet email.</p>`
  );
}

export async function sendLeadNurtureEmailA(toEmail: string): Promise<void> {
  await sendStudioEmail(
    toEmail,
    "As-tu trouve ton personnage ?",
    `<h1 style="font-size: 20px;">Le conseil le plus important de l'apercu</h1>
        <p>Il y a quelques jours, tu as recu l'apercu gratuit. S'il ne fallait retenir qu'une chose : choisis <b>un personnage recurrent</b> avec <b>un seul defaut clair</b>. C'est lui qui donne aux spectateurs une raison de revenir et de s'abonner.</p>
        <p>Si tu veux toute la methode (scripts, hooks, voix, montage CapCut, publication), la formation complete est ici :</p>
        ${studioButton(`${env.frontendOrigin}/#acheter`, "Voir la formation")}
        <p style="margin-top: 24px; font-size: 12px; color:#8a8f99;">Tu recevras encore 1 email apres celui-ci. Tu peux te desinscrire a tout moment en repondant a cet email.</p>`
  );
}

export async function sendLeadNurtureEmailB(toEmail: string): Promise<void> {
  await sendStudioEmail(
    toEmail,
    "Un dernier mot avant qu'on se quitte",
    `<h1 style="font-size: 20px;">Ta premiere saison en 30 jours</h1>
        <p>La formation Studio Cartoon suit un planning de 30 jours, une heure par jour : idees, scripts, kit visuel, voix, montage, puis une saison de 10 episodes prete a publier. Elle inclut 20 scripts complets a adapter.</p>
        ${studioButton(`${env.frontendOrigin}/#acheter`, "Decouvrir la formation")}
        <p>C'est le dernier email de cette serie. Une question ? Reponds simplement a cet email.</p>`
  );
}
