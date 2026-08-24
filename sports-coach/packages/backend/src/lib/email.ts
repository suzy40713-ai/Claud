import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resend } from "resend";
import { env } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EBOOK_PDF_PATH = path.join(__dirname, "..", "..", "ebook-assets", "transformation-90-jours.pdf");

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

export async function sendEbookEmail(toEmail: string): Promise<void> {
  const resend = getResend();
  const pdfBuffer = await readFile(EBOOK_PDF_PATH);

  const { error } = await resend.emails.send({
    from: env.ebookSenderEmail,
    to: toEmail,
    subject: "Ton ebook Transformation 90 Jours est arrive 👑",
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1c1c22;">
        <p style="font-size: 22px; margin-bottom: 4px;">👑 <strong>Cadenzo</strong></p>
        <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
        <p>Ton ebook <strong>Transformation 90 Jours</strong> est en piece jointe de cet email, pret a etre lu des maintenant.</p>
        <p>Une astuce avant de commencer : imprime (ou garde ouvertes) les pages du carnet de suivi a la fin du livre. C'est cet outil, rempli chaque semaine, qui fait la plus grande difference sur la duree.</p>
        <p style="margin-top: 24px;">On croit en toi. Bonne transformation.</p>
        <p style="color:#6a6680;">&mdash; L'equipe Cadenzo</p>
      </div>
    `,
    attachments: [
      {
        filename: "Kadence-Transformation-90-Jours.pdf",
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
      </div>
    `,
  });

  if (error) {
    throw new Error(`Echec de l'envoi de l'email Resend: ${error.message}`);
  }
}
