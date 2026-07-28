import type { Activity } from "@prisma/client";
import type { AcwrDTO, AcwrNiveauRisque } from "@sports-coach/shared";

const CHRONIC_WINDOW_DAYS = 28;
const ACUTE_WINDOW_DAYS = 7;
const CHRONIC_WEEKS = CHRONIC_WINDOW_DAYS / 7;
const MIN_SESSIONS_FOR_SIGNAL = 3;

function minutes(seconds: number): number {
  return Math.round((seconds / 60) * 10) / 10;
}

/**
 * Ratio charge aigue / charge chronique (ACWR), calcule sur la duree
 * d'entrainement (proxy simple en l'absence de RPE). Seuils issus de la
 * litterature sports science (Gabbett 2016) : zone optimale 0.8-1.3,
 * risque de blessure au-dela de 1.5.
 */
export function computeAcwr(activitiesLast28Days: Activity[]): AcwrDTO {
  const now = new Date();
  const acuteThreshold = new Date(now);
  acuteThreshold.setDate(acuteThreshold.getDate() - ACUTE_WINDOW_DAYS);

  const acuteSeconds = activitiesLast28Days
    .filter((a) => a.date >= acuteThreshold)
    .reduce((sum, a) => sum + a.duree, 0);
  const chronicSeconds = activitiesLast28Days.reduce((sum, a) => sum + a.duree, 0);

  const chargeAigueMin = minutes(acuteSeconds);
  const chargeChroniqueMin = minutes(chronicSeconds / CHRONIC_WEEKS);

  if (activitiesLast28Days.length < MIN_SESSIONS_FOR_SIGNAL || chronicSeconds === 0) {
    return {
      chargeAigueMin,
      chargeChroniqueMin,
      ratio: null,
      niveauRisque: "donnees_insuffisantes",
      explication: `Pas encore assez de seances enregistrees sur les 4 dernieres semaines (minimum ${MIN_SESSIONS_FOR_SIGNAL}) pour calculer un ratio de charge fiable.`,
    };
  }

  const ratio = Math.round((acuteSeconds / (chronicSeconds / CHRONIC_WEEKS)) * 100) / 100;

  let niveauRisque: AcwrNiveauRisque;
  let explication: string;

  if (ratio > 1.5) {
    niveauRisque = "eleve";
    explication = `Ta charge des 7 derniers jours (${chargeAigueMin} min) represente ${ratio}x ta charge moyenne des 4 dernieres semaines (${chargeChroniqueMin} min/semaine). Une augmentation aussi rapide du volume est associee a un risque de blessure accru. Une seance plus legere ou un jour de repos supplementaire serait raisonnable.`;
  } else if (ratio > 1.3) {
    niveauRisque = "modere";
    explication = `Ta charge recente (${chargeAigueMin} min sur 7 jours) augmente plus vite que ta charge habituelle (${chargeChroniqueMin} min/semaine en moyenne). Ratio de ${ratio} : reste attentif aux signaux de fatigue cette semaine.`;
  } else if (ratio >= 0.8) {
    niveauRisque = "optimal";
    explication = `Ta charge d'entrainement est stable (ratio de ${ratio} entre les 7 derniers jours et ta moyenne sur 4 semaines). C'est la zone associee au risque de blessure le plus faible.`;
  } else {
    niveauRisque = "sous_charge";
    explication = `Ta charge des 7 derniers jours (${chargeAigueMin} min) est nettement en dessous de ta moyenne habituelle (${chargeChroniqueMin} min/semaine). Pas de risque immediat, mais une reprise trop prudente peut freiner ta progression.`;
  }

  return { chargeAigueMin, chargeChroniqueMin, ratio, niveauRisque, explication };
}
