import type { Intensite, Niveau, Objectif, PlannedSessionType, Sport } from "@sports-coach/shared";

interface SessionTemplate {
  dayOffset: number; // 0 = lundi ... 6 = dimanche
  type: PlannedSessionType;
  intensite: Intensite;
}

const TEMPLATES: Record<Objectif, SessionTemplate[]> = {
  regularite: [
    { dayOffset: 1, type: "endurance_fondamentale", intensite: "faible" },
    { dayOffset: 5, type: "endurance_fondamentale", intensite: "faible" },
  ],
  perte_de_poids: [
    { dayOffset: 0, type: "endurance_fondamentale", intensite: "faible" },
    { dayOffset: 3, type: "seuil", intensite: "moderee" },
    { dayOffset: 5, type: "endurance_fondamentale", intensite: "faible" },
  ],
  preparation_course: [
    { dayOffset: 0, type: "endurance_fondamentale", intensite: "faible" },
    { dayOffset: 2, type: "fractionne", intensite: "elevee" },
    { dayOffset: 4, type: "seuil", intensite: "moderee" },
    { dayOffset: 6, type: "sortie_longue", intensite: "moderee" },
  ],
  performance: [
    { dayOffset: 0, type: "fractionne", intensite: "elevee" },
    { dayOffset: 2, type: "seuil", intensite: "moderee" },
    { dayOffset: 4, type: "endurance_fondamentale", intensite: "faible" },
    { dayOffset: 6, type: "sortie_longue", intensite: "moderee" },
  ],
};

// duree cible en minutes
const DUREE_MINUTES: Record<Niveau, Record<PlannedSessionType, number>> = {
  debutant: {
    endurance_fondamentale: 30,
    fractionne: 25,
    seuil: 25,
    sortie_longue: 45,
    recuperation: 20,
  },
  intermediaire: {
    endurance_fondamentale: 45,
    fractionne: 35,
    seuil: 35,
    sortie_longue: 75,
    recuperation: 30,
  },
  avance: {
    endurance_fondamentale: 60,
    fractionne: 45,
    seuil: 45,
    sortie_longue: 100,
    recuperation: 35,
  },
};

export interface GeneratedSession {
  date: Date;
  sport: Sport;
  type: PlannedSessionType;
  dureeCible: number; // secondes
  intensiteCible: Intensite;
}

export function generateWeeklySessions(params: {
  objectif: Objectif;
  niveau: Niveau;
  sportsPratiques: Sport[];
  semaineDebut: Date;
}): GeneratedSession[] {
  const { objectif, niveau, semaineDebut } = params;
  const sports = params.sportsPratiques.length > 0 ? params.sportsPratiques : (["course_a_pied"] as Sport[]);
  const templates = TEMPLATES[objectif];

  return templates.map((template, index) => {
    const date = new Date(semaineDebut);
    date.setDate(date.getDate() + template.dayOffset);
    const sport = sports[index % sports.length];
    const dureeMinutes = DUREE_MINUTES[niveau][template.type];

    return {
      date,
      sport,
      type: template.type,
      dureeCible: dureeMinutes * 60,
      intensiteCible: template.intensite,
    };
  });
}

export function mondayOfCurrentWeek(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}
