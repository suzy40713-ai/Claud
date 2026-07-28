import webpush from "web-push";
import { env } from "./env.js";

let configured = false;

export function isPushConfigured(): boolean {
  return Boolean(env.vapidPublicKey && env.vapidPrivateKey);
}

function ensureConfigured() {
  if (configured) return;
  if (!isPushConfigured()) {
    throw new Error("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY non configures : les notifications push sont indisponibles.");
  }
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey!, env.vapidPrivateKey!);
  configured = true;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
}

/**
 * Envoie une notification push. Retourne false (sans lever d'exception) si
 * l'abonnement n'est plus valide (410/404) -- l'appelant doit alors le
 * supprimer en base. Les autres erreurs reseau sont propagees.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionInput,
  payload: PushPayload
): Promise<{ delivered: boolean; expired: boolean }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { delivered: true, expired: false };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { delivered: false, expired: true };
    }
    throw error;
  }
}
