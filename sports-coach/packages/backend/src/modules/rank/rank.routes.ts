import { Router } from "express";
import multer from "multer";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import type { RankProfile } from "@prisma/client";
import {
  analyzePushupFrames,
  mondayOf,
  addDays,
  MAX_RANK,
  REPS_REQUISES,
  RANK_LABELS,
  FRAMES_PAR_DEFI,
} from "./rank.service.js";
import { toPushupChallengeDTO } from "./rank.mapper.js";
import type { RankStatusDTO } from "@sports-coach/shared";

export const rankRouter = Router();
rankRouter.use(requireAuth);

const HISTORY_LIMIT = 12;
// Les frames sont toujours generees en JPEG cote client (extraction canvas
// depuis la video enregistree) : pas besoin d'accepter d'autres formats ici.
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: FRAMES_PAR_DEFI },
});

function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Recupere (ou cree) le profil de rang de l'utilisateur, et resout les
 * semaines passees qui n'ont pas encore ete prises en compte : succes/echec
 * deja soumis, ou "manque" (aucune soumission) si la semaine s'est ecoulee
 * sans defi envoye. Idempotent et sans effet retroactif sur les semaines
 * anterieures a la creation du profil.
 */
async function getResolvedRankProfile(userId: string): Promise<RankProfile> {
  const currentWeekStart = mondayOf(new Date());

  let profile = await prisma.rankProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.rankProfile.create({
      data: { userId, rang: 0, derniereSemaineResolue: currentWeekStart },
    });
    return profile;
  }

  let { rang } = profile;
  let cursor = profile.derniereSemaineResolue ? addDays(profile.derniereSemaineResolue, 7) : currentWeekStart;

  while (cursor < currentWeekStart) {
    const existing = await prisma.pushupChallenge.findUnique({
      where: { userId_semaineDebut: { userId, semaineDebut: cursor } },
    });

    if (existing?.statut === "reussi") {
      rang = Math.min(MAX_RANK, rang + 1);
    } else if (existing?.statut === "echoue") {
      rang = Math.max(0, rang - 1);
    } else if (!existing) {
      rang = Math.max(0, rang - 1);
      await prisma.pushupChallenge.create({
        data: {
          userId,
          semaineDebut: cursor,
          statut: "manque",
          repsDetectees: 0,
          formeValide: false,
          commentaire: "Aucune video envoyee cette semaine-la.",
        },
      });
    }

    cursor = addDays(cursor, 7);
  }

  profile = await prisma.rankProfile.update({
    where: { userId },
    data: { rang, derniereSemaineResolue: currentWeekStart },
  });

  return profile;
}

async function buildRankStatus(userId: string, profile: RankProfile): Promise<RankStatusDTO> {
  const currentWeekStart = mondayOf(new Date());

  const [defiCourant, historique] = await Promise.all([
    prisma.pushupChallenge.findUnique({
      where: { userId_semaineDebut: { userId, semaineDebut: currentWeekStart } },
    }),
    prisma.pushupChallenge.findMany({
      where: { userId },
      orderBy: { semaineDebut: "desc" },
      take: HISTORY_LIMIT,
    }),
  ]);

  return {
    rang: profile.rang,
    rangLabel: RANK_LABELS[profile.rang],
    semaineDebutCourante: currentWeekStart.toISOString().slice(0, 10),
    defiCourant: defiCourant ? toPushupChallengeDTO(defiCourant) : null,
    historique: historique.map(toPushupChallengeDTO),
  };
}

rankRouter.get("/", async (req, res) => {
  const profile = await getResolvedRankProfile(req.userId!);
  res.json(await buildRankStatus(req.userId!, profile));
});

rankRouter.post("/defi", upload.array("frames", FRAMES_PAR_DEFI), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    res.status(400).json({ error: "Aucune image exploitable recue." });
    return;
  }
  if (files.some((f) => !ALLOWED_IMAGE_TYPES.has(f.mimetype))) {
    res.status(400).json({ error: "Format d'image non supporte (jpeg, png ou webp uniquement)." });
    return;
  }

  if (!anthropicConfigured()) {
    res.status(503).json({ error: "L'analyse du defi n'est pas configuree sur ce serveur." });
    return;
  }

  const userId = req.userId!;
  const profile = await getResolvedRankProfile(userId);
  const currentWeekStart = mondayOf(new Date());

  const already = await prisma.pushupChallenge.findUnique({
    where: { userId_semaineDebut: { userId, semaineDebut: currentWeekStart } },
  });
  if (already) {
    res.status(409).json({ error: "Tu as deja soumis ton defi cette semaine." });
    return;
  }

  try {
    const framesBase64 = files.map((f) => f.buffer.toString("base64"));
    const analysis = await analyzePushupFrames(framesBase64);
    const reussi = analysis.repsDetectees >= REPS_REQUISES && analysis.formeValide;

    await prisma.pushupChallenge.create({
      data: {
        userId,
        semaineDebut: currentWeekStart,
        statut: reussi ? "reussi" : "echoue",
        repsDetectees: analysis.repsDetectees,
        formeValide: analysis.formeValide,
        commentaire: analysis.commentaire,
      },
    });

    const updatedProfile = await prisma.rankProfile.update({
      where: { userId },
      data: { rang: reussi ? Math.min(MAX_RANK, profile.rang + 1) : Math.max(0, profile.rang - 1) },
    });

    res.status(201).json(await buildRankStatus(userId, updatedProfile));
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : "Impossible d'analyser cette video.",
    });
  }
});
