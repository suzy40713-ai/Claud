import type { Archetype, Division, Poste, PlayStyle, Region, Langue } from "@/types";

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

export interface ArchetypeDef {
  id: Archetype;
  nomEn?: string;
  categorie: "Gardien" | "Défenseur" | "Milieu" | "Attaquant";
  postes: Poste[];
  playstyles: [PlayStyle, PlayStyle];
  icon: string;
}

// Archétypes officiels FC 27 Pro Clubs (2 Gardiens, 4 Défenseurs, 4 Milieux, 3 Attaquants)
export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: "Gardien pur",
    nomEn: "Shot Stopper",
    categorie: "Gardien",
    postes: ["GB"],
    playstyles: [
      { fr: "Arrêt du pied", en: "Footwork" },
      { fr: "Classe de loin", en: "Far Reach" },
    ],
    icon: "Hand",
  },
  {
    id: "Gardien-libéro",
    nomEn: "Sweeper Keeper",
    categorie: "Gardien",
    postes: ["GB"],
    playstyles: [
      { fr: "Sortie sur les centres", en: "Cross Claimer" },
      { fr: "1 contre 1", en: "1v1 Close Down" },
    ],
    icon: "MoveHorizontal",
  },
  {
    id: "Boss",
    categorie: "Défenseur",
    postes: ["DC"],
    playstyles: [
      { fr: "Agressif", en: "Bruiser" },
      { fr: "Forteresse aérienne", en: "Aerial Fortress" },
    ],
    icon: "ShieldBan",
  },
  {
    id: "Progresseur DC",
    categorie: "Défenseur",
    postes: ["DC"],
    playstyles: [
      { fr: "Passe longue", en: "Long Ball Pass" },
      { fr: "Anticipation", en: "Anticipate" },
    ],
    icon: "SendHorizontal",
  },
  {
    id: "Moteur",
    categorie: "Défenseur",
    postes: ["DD", "DG"],
    playstyles: [
      { fr: "Jockey", en: "Jockey" },
      { fr: "Infatigable", en: "Relentless" },
    ],
    icon: "GaugeCircle",
  },
  {
    id: "Maraudeur",
    categorie: "Défenseur",
    postes: ["DD", "DG"],
    playstyles: [
      { fr: "Centre fouetté", en: "Whipped Pass" },
      { fr: "Foulée rapide", en: "Quick Step" },
    ],
    icon: "ArrowUpRight",
  },
  {
    id: "Recycler",
    categorie: "Milieu",
    postes: ["MDC", "MC"],
    playstyles: [
      { fr: "Press Proven", en: "Press Proven" },
      { fr: "Interception", en: "Interception" },
    ],
    icon: "ShieldAlert",
  },
  {
    id: "Maestro",
    categorie: "Milieu",
    postes: ["MC"],
    playstyles: [
      { fr: "Tiki Taka", en: "Tiki Taka" },
      { fr: "Passe longue tendue", en: "Pinged Pass" },
    ],
    icon: "Compass",
  },
  {
    id: "Créateur",
    categorie: "Milieu",
    postes: ["MOC"],
    playstyles: [
      { fr: "Passe incisive", en: "Incisive Pass" },
      { fr: "Passe inventive", en: "Inventive Pass" },
    ],
    icon: "Wand2",
  },
  {
    id: "Étincelle",
    nomEn: "Spark",
    categorie: "Milieu",
    postes: ["MOC", "AG", "AD"],
    playstyles: [
      { fr: "Rapide", en: "Rapid" },
      { fr: "Trickster", en: "Trickster" },
    ],
    icon: "Zap",
  },
  {
    id: "Magicien",
    categorie: "Attaquant",
    postes: ["AG", "AD", "BU"],
    playstyles: [
      { fr: "Technique", en: "Technical" },
      { fr: "Tir en finesse", en: "Finesse Shot" },
    ],
    icon: "Sparkles",
  },
  {
    id: "Finisseur",
    categorie: "Attaquant",
    postes: ["BU"],
    playstyles: [
      { fr: "Tir à ras de terre", en: "Low Driven Shot" },
      { fr: "Premier contact", en: "First Touch" },
    ],
    icon: "Crosshair",
  },
  {
    id: "Cible",
    categorie: "Attaquant",
    postes: ["BU"],
    playstyles: [
      { fr: "Jeu de tête précis", en: "Precision Header" },
      { fr: "Protection du ballon", en: "Press Proven" },
    ],
    icon: "Target",
  },
];

export const ARCHETYPE_PAR_ID: Record<Archetype, ArchetypeDef> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.id, a])
) as Record<Archetype, ArchetypeDef>;

export const ARCHETYPES_PAR_POSTE: Record<Poste, Archetype[]> = Object.fromEntries(
  POSTES.map((p) => [p, ARCHETYPES.filter((a) => a.postes.includes(p)).map((a) => a.id)])
) as Record<Poste, Archetype[]>;

export const TOUS_ARCHETYPES: Archetype[] = ARCHETYPES.map((a) => a.id);

export const ARCHETYPE_ICONS: Record<Archetype, string> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.id, a.icon])
) as Record<Archetype, string>;

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
