import { prisma } from "../../lib/prisma.js";

const ACTIVITY_LOOKBACK_DAYS = 14;
const DAILY_LOG_LOOKBACK_DAYS = 14;

export async function buildUserContext(userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - Math.max(ACTIVITY_LOOKBACK_DAYS, DAILY_LOG_LOOKBACK_DAYS));

  const [user, injuries, activities, dailyLogs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.injuryHistory.findMany({ where: { userId } }),
    prisma.activity.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "desc" },
    }),
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "desc" },
    }),
  ]);

  return {
    profil: {
      objectif: user.objectif,
      niveau: user.niveau,
      sportsPratiques: user.sportsPratiques,
      blessuresPassees: injuries.map((i) => ({
        zone: i.zone,
        type: i.type,
        dateApprox: i.dateApprox?.toISOString().slice(0, 10) ?? null,
        notes: i.notes,
      })),
    },
    activitesRecentes: activities.map((a) => ({
      date: a.date.toISOString().slice(0, 10),
      sport: a.sport,
      distanceKm: Math.round((a.distance / 1000) * 10) / 10,
      dureeMin: Math.round(a.duree / 60),
      denivele: a.denivele,
      fcMoyenne: a.fcMoyenne,
      allureMinParKm:
        a.allureMoyenne ?? (a.distance > 0 ? a.duree / (a.distance / 1000) : null),
    })),
    journalQuotidien: dailyLogs.map((l) => ({
      date: l.date.toISOString().slice(0, 10),
      sommeil: l.sommeil,
      fatigue: l.fatigue,
      stress: l.stress,
    })),
  };
}
