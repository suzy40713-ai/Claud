import { Router } from "express";
import multer from "multer";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePremium } from "../../middleware/premium.js";
import { analyzeMealImage, generateGroceryList } from "./nutrition.service.js";
import { toGroceryListDTO, toMealScanDTO } from "./nutrition.mapper.js";

export const nutritionRouter = Router();
nutritionRouter.use(requireAuth);

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

nutritionRouter.get("/grocery-list", async (req, res) => {
  const list = await prisma.groceryList.findFirst({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ list: list ? toGroceryListDTO(list) : null });
});

nutritionRouter.post("/grocery-list", requirePremium, async (req, res) => {
  if (!anthropicConfigured()) {
    res.status(503).json({ error: "La generation IA n'est pas configuree sur ce serveur." });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });

  try {
    const items = await generateGroceryList({
      objectif: user.objectif,
      niveau: user.niveau,
      sportsPratiques: user.sportsPratiques,
    });

    const list = await prisma.groceryList.create({
      data: { userId: req.userId!, items: items as any },
    });

    res.status(201).json({ list: toGroceryListDTO(list) });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : "Impossible de generer la liste de courses.",
    });
  }
});

nutritionRouter.get("/meal-scans", async (req, res) => {
  const scans = await prisma.mealScan.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json({ scans: scans.map(toMealScanDTO) });
});

nutritionRouter.post("/scan-meal", requirePremium, upload.single("photo"), async (req, res) => {
  if (!anthropicConfigured()) {
    res.status(503).json({ error: "L'analyse IA n'est pas configuree sur ce serveur." });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Aucune photo fournie." });
    return;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    res.status(400).json({ error: "Format d'image non supporte (jpeg, png ou webp uniquement)." });
    return;
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    const analysis = await analyzeMealImage(file.buffer.toString("base64"), file.mimetype, {
      objectif: user.objectif,
      niveau: user.niveau,
      sportsPratiques: user.sportsPratiques,
    });

    const scan = await prisma.mealScan.create({
      data: {
        userId: req.userId!,
        description: analysis.description,
        calories: analysis.calories,
        proteinesG: analysis.proteinesG,
        glucidesG: analysis.glucidesG,
        lipidesG: analysis.lipidesG,
        confiance: analysis.confiance,
        adequationObjectif: analysis.adequationObjectif,
        commentaireObjectif: analysis.commentaireObjectif,
      },
    });

    res.status(201).json({ scan: toMealScanDTO(scan) });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : "Impossible d'analyser cette photo.",
    });
  }
});
