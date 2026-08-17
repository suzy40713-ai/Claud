import type { Archetype, Division, Poste, Region, Langue } from "@/types";

export const POSTES: Poste[] = ["GB", "DC", "DD", "DG", "MDC", "MC", "MOC", "AD", "AG", "BU"];

export const POSTE_LABELS: Record<Poste, string> = {
  GB: "Gardien de but",
  DC: "Défenseur central",
  DD: "Défenseur droit",
  DG: "Défenseur gauche",
  MDC: "Milieu défensif",
  MC: "Milieu central",
  MOC: "Milieu offensif",
  AD: "Ailier droit",
  AG: "Ailier gauche",
  BU: "Buteur",
};

export const ARCHETYPES_PAR_POSTE: Record<Poste, Archetype[]> = {
  BU: ["Finisseur", "Faux 9", "Attaquant Cible", "Poacher"],
  AD: ["Ailier Rapide", "Ailier Créatif", "Élimination"],
  AG: ["Ailier Rapide", "Ailier Créatif", "Élimination"],
  MOC: ["Meneur de Jeu Avancé", "Le Dix", "Box-to-Box"],
  MDC: ["Sentinelle", "Meneur de Jeu Profond", "Milieu Destructeur"],
  MC: ["Box-to-Box", "Meneur de Jeu Profond", "Milieu Destructeur"],
  DD: ["Latéral Offensif", "Latéral Défensif", "Ailier Piston"],
  DG: ["Latéral Offensif", "Latéral Défensif", "Ailier Piston"],
  DC: ["Stopper", "Défenseur Relanceur", "Défenseur Physique"],
  GB: ["Gardien Classique", "Gardien Libéro", "Gardien Réflexes"],
};

export const TOUS_ARCHETYPES: Archetype[] = Array.from(
  new Set(Object.values(ARCHETYPES_PAR_POSTE).flat())
);

export const ARCHETYPE_ICONS: Record<Archetype, string> = {
  Finisseur: "Crosshair",
  "Faux 9": "Sparkles",
  "Attaquant Cible": "Target",
  Poacher: "Zap",
  "Ailier Rapide": "Wind",
  "Ailier Créatif": "Wand2",
  Élimination: "Swords",
  "Meneur de Jeu Avancé": "Compass",
  "Le Dix": "Star",
  "Box-to-Box": "RefreshCw",
  Sentinelle: "ShieldAlert",
  "Meneur de Jeu Profond": "Radar",
  "Milieu Destructeur": "Hammer",
  "Latéral Offensif": "ArrowUpRight",
  "Latéral Défensif": "ArrowDownRight",
  "Ailier Piston": "GaugeCircle",
  Stopper: "ShieldBan",
  "Défenseur Relanceur": "SendHorizontal",
  "Défenseur Physique": "Dumbbell",
  "Gardien Classique": "Hand",
  "Gardien Libéro": "MoveHorizontal",
  "Gardien Réflexes": "Timer",
};

export const DIVISIONS: Division[] = [
  "Division 10",
  "Division 9",
  "Division 8",
  "Division 7",
  "Division 6",
  "Division 5",
  "Division 4",
  "Division 3",
  "Division 2",
  "Division 1",
  "Élite",
  "Champions",
];

export const DIVISION_COLOR: Record<Division, string> = {
  "Division 10": "text-zinc-400",
  "Division 9": "text-zinc-300",
  "Division 8": "text-amber-700",
  "Division 7": "text-amber-600",
  "Division 6": "text-slate-300",
  "Division 5": "text-slate-200",
  "Division 4": "text-sky-400",
  "Division 3": "text-sky-300",
  "Division 2": "text-violet-400",
  "Division 1": "text-fuchsia-400",
  Élite: "text-amber-400",
  Champions: "text-yellow-300",
};

export const REGIONS: Region[] = [
  "France",
  "Belgique",
  "Suisse",
  "Maroc",
  "Sénégal",
  "Côte d'Ivoire",
  "Canada",
  "Cameroun",
  "Algérie",
  "Tunisie",
];

export const LANGUES: Langue[] = ["Français", "Anglais", "Arabe", "Espagnol"];

export const NAV_LINKS = [
  { href: "/", label: "Accueil", icon: "Home" },
  { href: "/recrutement", label: "Recrutement", icon: "Briefcase" },
  { href: "/live", label: "Live", icon: "Radio" },
  { href: "/tournois", label: "Tournois", icon: "Trophy" },
  { href: "/matchmaking", label: "Matchmaking", icon: "Swords" },
  { href: "/classement", label: "Classement", icon: "BarChart3" },
  { href: "/messages", label: "Messages", icon: "MessageCircle" },
  { href: "/african-fc", label: "African FC", icon: "Flame" },
];

export const BOTTOM_NAV_LINKS = [
  { href: "/", label: "Accueil", icon: "Home" },
  { href: "/recrutement", label: "Recrutement", icon: "Briefcase" },
  { href: "/live", label: "Live", icon: "Radio" },
  { href: "/tournois", label: "Tournois", icon: "Trophy" },
  { href: "/messages", label: "Messages", icon: "MessageCircle" },
];
