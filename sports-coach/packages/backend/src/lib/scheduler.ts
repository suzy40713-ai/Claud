import { env } from "./env.js";
import { isPushConfigured } from "./push.js";
import { runOverloadCheckForAllUsers } from "../modules/push/overload-check.js";

/**
 * Verifie periodiquement le risque de surcharge de tous les utilisateurs
 * abonnes aux notifications push, meme s'ils n'ont pas l'app ouverte.
 * Approche mono-processus adaptee au MVP (pas de file d'attente distribuee).
 */
export function startOverloadAlertScheduler(): void {
  if (!isPushConfigured()) {
    console.log("Notifications push non configurees (VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY absents) : verification periodique desactivee.");
    return;
  }

  const intervalMs = env.overloadCheckIntervalMs;
  console.log(`Verification periodique de surcharge activee (toutes les ${Math.round(intervalMs / 60000)} min).`);

  setInterval(() => {
    runOverloadCheckForAllUsers().catch((error) => {
      console.error("Erreur lors de la verification periodique de surcharge:", error);
    });
  }, intervalMs);
}
