import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { isEmailConfigured, sendLeadMagnetEmail } from "../../lib/email.js";
import { NURTURE_STEP_1_DELAY_MS } from "./leads.nurture.js";

// Capture d'email sans compte requis, en echange d'un mini-guide gratuit
// envoye par email. Comme ebookRouter, pas de requireAuth ici.
export const leadsRouter = Router();

const captureSchema = z.object({
  email: z.string().email("Email invalide"),
  source: z.string().min(1).max(64),
});

leadsRouter.post("/capture", async (req, res) => {
  const parsed = captureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Requete invalide" });
    return;
  }
  const { email, source } = parsed.data;

  await prisma.emailLead.upsert({
    where: { email },
    update: {},
    create: { email, source, nextNurtureAt: new Date(Date.now() + NURTURE_STEP_1_DELAY_MS) },
  });

  if (isEmailConfigured()) {
    try {
      await sendLeadMagnetEmail(email);
    } catch (error) {
      // L'email est deja enregistre : un echec d'envoi ne doit pas faire
      // echouer la capture (l'utilisatrice verrait une erreur alors que
      // son email est bien pris en compte).
      console.error("Echec de l'envoi du mini-guide gratuit:", error);
    }
  }

  res.json({ ok: true });
});
