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
        <p style="font-size: 22px; margin-bottom: 4px;">👑 <strong>Kadence IA</strong></p>
        <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
        <p>Ton ebook <strong>Transformation 90 Jours</strong> est en piece jointe de cet email, pret a etre lu des maintenant.</p>
        <p>Une astuce avant de commencer : imprime (ou garde ouvertes) les pages du carnet de suivi a la fin du livre. C'est cet outil, rempli chaque semaine, qui fait la plus grande difference sur la duree.</p>
        <p style="margin-top: 24px;">On croit en toi. Bonne transformation.</p>
        <p style="color:#6a6680;">&mdash; L'equipe Kadence IA</p>
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
