import { env } from "./env.js";
import { isPushConfigured } from "./push.js";
import { isEmailConfigured } from "./email.js";
import { runOverloadCheckForAllUsers } from "../modules/push/overload-check.js";
import { runLeadNurtureCheck } from "../modules/leads/leads.nurture.js";

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

/**
 * Verifie periodiquement si des leads (emails captures via le mini-guide
 * gratuit) ont une relance email due, et l'envoie. Meme approche
 * mono-processus que startOverloadAlertScheduler.
 */
export function startLeadNurtureScheduler(): void {
  if (!isEmailConfigured()) {
    console.log("RESEND_API_KEY non configure : relance email des leads desactivee.");
    return;
  }

  const intervalMs = env.leadNurtureIntervalMs;
  console.log(`Relance email des leads activee (verification toutes les ${Math.round(intervalMs / 60000)} min).`);

  setInterval(() => {
    runLeadNurtureCheck().catch((error) => {
      console.error("Erreur lors de la verification periodique des relances email:", error);
    });
  }, intervalMs);
}
