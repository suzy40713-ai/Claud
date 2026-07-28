import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { SPORTS } from "@sports-coach/shared";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { parseFit, parseGpx, parseTcx } from "./activities.parser.js";
import { toActivityDTO } from "./activities.mapper.js";
import { computeWeeklyVolume } from "./weekly-volume.js";

export const activitiesRouter = Router();
activitiesRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const uploadMetaSchema = z.object({
  sport: z.enum(SPORTS),
});

activitiesRouter.post("/import", upload.single("file"), async (req, res) => {
  const parsedMeta = uploadMetaSchema.safeParse(req.body);
  if (!parsedMeta.success) {
    res.status(400).json({ error: "Sport manquant ou invalide" });
    return;
  }
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Aucun fichier fourni" });
    return;
  }

  const extension = file.originalname.split(".").pop()?.toLowerCase();
  try {
    let parsed;
    let sourceFormat: "fit" | "gpx" | "tcx";

    if (extension === "fit") {
      parsed = await parseFit(file.buffer);
      sourceFormat = "fit";
    } else if (extension === "gpx") {
      parsed = parseGpx(file.buffer.toString("utf-8"));
      sourceFormat = "gpx";
    } else if (extension === "tcx") {
      parsed = parseTcx(file.buffer.toString("utf-8"));
      sourceFormat = "tcx";
    } else {
      res.status(400).json({ error: "Format de fichier non supporte (.fit, .gpx, .tcx uniquement)" });
      return;
    }

    const activity = await prisma.activity.create({
      data: {
        userId: req.userId!,
        date: parsed.date,
        sport: parsedMeta.data.sport,
        duree: parsed.duree,
        distance: parsed.distance,
        denivele: parsed.denivele,
        fcMoyenne: parsed.fcMoyenne,
        sourceFormat,
        sourceFile: file.originalname,
        rawData: parsed.raw as any,
      },
    });

    res.status(201).json({ activity: toActivityDTO(activity) });
  } catch (error) {
    res.status(422).json({
      error: error instanceof Error ? error.message : "Impossible de parser ce fichier",
    });
  }
});

activitiesRouter.get("/", async (req, res) => {
  const activities = await prisma.activity.findMany({
    where: { userId: req.userId },
    orderBy: { date: "desc" },
  });
  res.json({ activities: activities.map(toActivityDTO) });
});

activitiesRouter.get("/weekly-volume", async (req, res) => {
  const weeks = Math.min(Number(req.query.weeks ?? 12), 52);
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const activities = await prisma.activity.findMany({
    where: { userId: req.userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  res.json({ weeklyVolume: computeWeeklyVolume(activities) });
});
