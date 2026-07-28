import { prisma } from "../../lib/prisma.js";
import { isPushConfigured, sendPushNotification } from "../../lib/push.js";
import { computeAcwr } from "../training-plan/acwr.js";

const ACTIVITY_LOOKBACK_DAYS = 28;
const ALERT_THROTTLE_MS = 24 * 60 * 60 * 1000;

/**
 * Verifie le risque de surcharge (ACWR) d'un utilisateur et envoie une
 * notification push preventive si le niveau est "eleve" et qu'aucune alerte
 * n'a ete envoyee dans les dernieres 24h. Ne pose jamais de diagnostic
 * medical : redirige implicitement vers l'app pour plus de contexte.
 */
export async function checkAndNotifyOverloadRisk(
  userId: string,
  options: { ignoreThrottle?: boolean } = {}
): Promise<boolean> {
  if (!isPushConfigured()) return false;

  const [subscriptions, user] = await Promise.all([
    prisma.pushSubscription.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (subscriptions.length === 0 || !user) return false;

  if (
    !options.ignoreThrottle &&
    user.lastAcwrAlertAt &&
    Date.now() - user.lastAcwrAlertAt.getTime() < ALERT_THROTTLE_MS
  ) {
    return false;
  }

  const since = new Date();
  since.setDate(since.getDate() - ACTIVITY_LOOKBACK_DAYS);
  const activities = await prisma.activity.findMany({ where: { userId, date: { gte: since } } });
  const acwr = computeAcwr(activities);

  if (acwr.niveauRisque !== "eleve") return false;

  const payload = {
    title: "Alerte de surcharge",
    body: `${acwr.explication} Ouvre l'app pour voir le detail de ton plan.`,
  };

  const expiredIds: string[] = [];
  for (const subscription of subscriptions) {
    try {
      const result = await sendPushNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload
      );
      if (result.expired) expiredIds.push(subscription.id);
    } catch (error) {
      // Un abonnement individuel invalide ou une erreur reseau ne doit jamais
      // empecher de notifier les autres abonnements ni de marquer l'alerte.
      console.error(`Envoi push echoue pour l'abonnement ${subscription.id}:`, error);
    }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { lastAcwrAlertAt: new Date() } }),
    ...(expiredIds.length > 0
      ? [prisma.pushSubscription.deleteMany({ where: { id: { in: expiredIds } } })]
      : []),
  ]);

  return true;
}

/**
 * Parcourt tous les utilisateurs ayant au moins un abonnement push et
 * declenche la verification de surcharge pour chacun. Concu pour tourner
 * periodiquement en arriere-plan (voir lib/scheduler.ts).
 */
export async function runOverloadCheckForAllUsers(): Promise<void> {
  if (!isPushConfigured()) return;

  const userIds = await prisma.pushSubscription.findMany({
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of userIds) {
    try {
      await checkAndNotifyOverloadRisk(userId);
    } catch (error) {
      console.error(`Erreur lors de la verification de surcharge pour ${userId}:`, error);
    }
  }
}
