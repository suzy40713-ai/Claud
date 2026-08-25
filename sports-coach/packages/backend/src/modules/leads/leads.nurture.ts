import { prisma } from "../../lib/prisma.js";
import { isEmailConfigured, sendLeadNurtureEmailA, sendLeadNurtureEmailB } from "../../lib/email.js";

// Sequence courte de relance : mini-guide immediat (nurtureStep 0), puis 2
// emails espaces dans le temps. J+2 pour la 1ere relance, J+6 (soit 4 jours
// de plus) pour la 2eme et derniere.
export const NURTURE_STEP_1_DELAY_MS = 2 * 24 * 60 * 60 * 1000;
const NURTURE_STEP_2_DELAY_MS = 4 * 24 * 60 * 60 * 1000;

const BATCH_SIZE = 50;

/**
 * Envoie les relances email dues (verifie periodiquement par le scheduler).
 * Traite un petit lot a chaque appel plutot que tout d'un coup, pour rester
 * simple et ne jamais bloquer longtemps le process mono-thread.
 */
export async function runLeadNurtureCheck(): Promise<void> {
  if (!isEmailConfigured()) {
    return;
  }

  const now = new Date();

  const dueStep0 = await prisma.emailLead.findMany({
    where: { nurtureStep: 0, nextNurtureAt: { lte: now } },
    take: BATCH_SIZE,
  });
  for (const lead of dueStep0) {
    try {
      await sendLeadNurtureEmailA(lead.email);
      await prisma.emailLead.update({
        where: { id: lead.id },
        data: { nurtureStep: 1, nextNurtureAt: new Date(now.getTime() + NURTURE_STEP_2_DELAY_MS) },
      });
    } catch (error) {
      console.error(`Echec de l'envoi de la relance A pour ${lead.email}:`, error);
    }
  }

  const dueStep1 = await prisma.emailLead.findMany({
    where: { nurtureStep: 1, nextNurtureAt: { lte: now } },
    take: BATCH_SIZE,
  });
  for (const lead of dueStep1) {
    try {
      await sendLeadNurtureEmailB(lead.email);
      await prisma.emailLead.update({
        where: { id: lead.id },
        data: { nurtureStep: 2, nextNurtureAt: null },
      });
    } catch (error) {
      console.error(`Echec de l'envoi de la relance B pour ${lead.email}:`, error);
    }
  }
}
