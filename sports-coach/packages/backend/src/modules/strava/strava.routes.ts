import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  buildAuthorizeUrl,
  deauthorize,
  exchangeAuthorizationCode,
  fetchRecentActivities,
  isStravaConfigured,
  mapStravaActivity,
  refreshAccessToken,
} from "./strava.service.js";

export const stravaRouter = Router();
stravaRouter.use(requireAuth);

const SYNC_LOOKBACK_DAYS = 30;
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

function withConfigCheck(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    if (!isStravaConfigured()) {
      res.status(503).json({ error: "L'import Strava n'est pas configure sur ce serveur." });
      return;
    }
    await handler(req, res, next);
  };
}

stravaRouter.get("/status", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    configured: isStravaConfigured(),
    connected: Boolean(user.stravaAthleteId && user.stravaAccessToken),
    lastSyncAt: user.stravaLastSyncAt?.toISOString() ?? null,
  });
});

stravaRouter.get("/authorize-url", withConfigCheck(async (_req, res) => {
  res.json({ url: buildAuthorizeUrl() });
}));

const callbackSchema = z.object({ code: z.string().min(1) });

stravaRouter.post("/callback", withConfigCheck(async (req, res) => {
  const parsed = callbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Code d'autorisation manquant" });
    return;
  }

  const tokens = await exchangeAuthorizationCode(parsed.data.code);
  await prisma.user.update({
    where: { id: req.userId },
    data: {
      stravaAthleteId: tokens.athleteId,
      stravaAccessToken: tokens.accessToken,
      stravaRefreshToken: tokens.refreshToken,
      stravaTokenExpiresAt: tokens.expiresAt,
    },
  });

  res.json({ connected: true });
}));

async function ensureValidAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.stravaAccessToken || !user.stravaRefreshToken) {
    throw Object.assign(new Error("Compte Strava non connecte."), { statusCode: 409 });
  }

  const expiresAt = user.stravaTokenExpiresAt?.getTime() ?? 0;
  if (expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS) {
    return user.stravaAccessToken;
  }

  const refreshed = await refreshAccessToken(user.stravaRefreshToken);
  await prisma.user.update({
    where: { id: userId },
    data: {
      stravaAccessToken: refreshed.accessToken,
      stravaRefreshToken: refreshed.refreshToken,
      stravaTokenExpiresAt: refreshed.expiresAt,
    },
  });
  return refreshed.accessToken;
}

stravaRouter.post("/sync", withConfigCheck(async (req, res) => {
  const userId = req.userId!;
  let accessToken: string;
  try {
    accessToken = await ensureValidAccessToken(userId);
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({ error: error instanceof Error ? error.message : "Erreur" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const since = user.stravaLastSyncAt ?? new Date(Date.now() - SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const rawActivities = await fetchRecentActivities(accessToken, since);
  const mapped = rawActivities.map(mapStravaActivity).filter((a): a is NonNullable<typeof a> => a !== null);

  let imported = 0;
  for (const activity of mapped) {
    const result = await prisma.activity.upsert({
      where: { stravaId: activity.stravaId },
      create: {
        userId,
        date: activity.date,
        sport: activity.sport,
        duree: activity.duree,
        distance: activity.distance,
        denivele: activity.denivele,
        fcMoyenne: activity.fcMoyenne,
        sourceFormat: "strava",
        stravaId: activity.stravaId,
        rawData: activity.rawData as unknown as object,
      },
      update: {
        duree: activity.duree,
        distance: activity.distance,
        denivele: activity.denivele,
        fcMoyenne: activity.fcMoyenne,
      },
    });
    if (result) imported++;
  }

  await prisma.user.update({ where: { id: userId }, data: { stravaLastSyncAt: new Date() } });

  res.json({ imported, totalFetched: rawActivities.length });
}));

stravaRouter.delete("/disconnect", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.stravaAccessToken) {
    await deauthorize(user.stravaAccessToken);
  }
  await prisma.user.update({
    where: { id: req.userId },
    data: {
      stravaAthleteId: null,
      stravaAccessToken: null,
      stravaRefreshToken: null,
      stravaTokenExpiresAt: null,
    },
  });
  res.status(204).send();
});
