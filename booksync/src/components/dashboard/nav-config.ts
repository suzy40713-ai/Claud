import type { Permission } from "@/domain/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon:
    | "home"
    | "calendar"
    | "list"
    | "users"
    | "scissors"
    | "team"
    | "bell"
    | "chart"
    | "settings"
    | "card"
    | "autopilot"
    | "waitlist"
    | "insights"
    | "assistant"
    | "reviews"
    | "gift"
    | "package"
    | "analysis"
    | "strategy"
    | "megaphone"
    | "content"
    | "booster"
    | "idea"
    | "academy";
  /** Une phrase qui explique à quoi sert la page (menu mobile). */
  hint: string;
  group: NavGroup;
  permission?: Permission;
  /** Entrée du module rendez-vous : masquée quand l'entreprise l'a désactivé. */
  bookingModule?: boolean;
  /** Visible seulement quand l'assistant IA est activé. */
  requiresAssistant?: boolean;
  /** Affiché dans la barre d'onglets mobile */
  mobile?: boolean;
};

export type NavGroup =
  | "accueil"
  | "demarrer"
  | "marketing"
  | "progres"
  | "rdv"
  | "clients"
  | "salon"
  | "suivi"
  | "compte";

/** Sections du menu, dans l'ordre d'affichage (titre vide = pas de titre). */
export const NAV_GROUPS: Array<{ id: NavGroup; title: string }> = [
  { id: "accueil", title: "" },
  { id: "demarrer", title: "Démarrer" },
  { id: "marketing", title: "Marketing" },
  { id: "progres", title: "Suivi" },
  { id: "rdv", title: "Module rendez-vous" },
  { id: "clients", title: "Clients et ventes" },
  { id: "salon", title: "Mon activité" },
  { id: "suivi", title: "Suivi et automatisations" },
  { id: "compte", title: "Compte" },
];

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/tableau-de-bord",
    label: "Tableau de bord",
    hint: "Votre progression et votre prochaine action",
    icon: "home",
    group: "accueil",
    mobile: true,
  },
  {
    href: "/tableau-de-bord/trouver-une-idee",
    label: "Trouver une idée",
    hint: "Quoi vendre à partir de ce que tu sais faire",
    icon: "idea",
    group: "demarrer",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/academie",
    label: "Académie",
    hint: "Apprendre le business, leçon par leçon",
    icon: "academy",
    group: "demarrer",
    mobile: true,
  },
  {
    href: "/tableau-de-bord/produits",
    label: "Mes produits",
    hint: "Ce que tu vends",
    icon: "package",
    group: "marketing",
    permission: "marketing.manage",
    mobile: true,
  },
  {
    href: "/tableau-de-bord/analyse-produit",
    label: "Analyse IA",
    hint: "Forces, faiblesses, positionnement et potentiel de vos produits",
    icon: "analysis",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/clients-cibles",
    label: "Recherche de clients",
    hint: "Vos clients idéaux, leurs besoins et où les trouver",
    icon: "users",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/concurrence",
    label: "Concurrence",
    hint: "Positionnement, offres et différenciation face aux concurrents",
    icon: "insights",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/strategies",
    label: "Stratégies marketing",
    hint: "Votre plan marketing sur 30 jours",
    icon: "strategy",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/publicites",
    label: "Publicités",
    hint: "Publicités TikTok, Instagram, Facebook, Google",
    icon: "megaphone",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/contenus",
    label: "Création de contenu",
    hint: "Scripts vidéo, carrousels et posts",
    icon: "content",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/sales-booster",
    label: "Optimisation des ventes",
    hint: "Plus d'acheteurs parmi vos visiteurs",
    icon: "booster",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/autopilot-marketing",
    label: "Plan d'action",
    hint: "Vos actions du jour, à cocher",
    icon: "autopilot",
    group: "progres",
    mobile: true,
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/resultats",
    label: "Mes résultats",
    hint: "Tes ventes, tes dépenses, ta rentabilité",
    icon: "chart",
    group: "progres",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/calendrier",
    bookingModule: true,
    label: "Calendrier",
    hint: "Votre agenda jour par jour",
    icon: "calendar",
    group: "rdv",
  },
  {
    href: "/tableau-de-bord/reservations",
    bookingModule: true,
    label: "Réservations",
    hint: "Liste de tous les rendez-vous",
    icon: "list",
    group: "rdv",
  },
  {
    href: "/tableau-de-bord/liste-attente",
    bookingModule: true,
    label: "Liste d'attente",
    hint: "Clients prévenus quand un créneau se libère",
    icon: "waitlist",
    group: "rdv",
    permission: "customers.view_all",
  },
  {
    href: "/tableau-de-bord/clients",
    bookingModule: true,
    label: "Clients",
    hint: "Fiches et historique de vos clients",
    icon: "users",
    group: "clients",
    permission: "customers.view_all",
    mobile: true,
  },
  {
    href: "/tableau-de-bord/avis",
    bookingModule: true,
    label: "Avis",
    hint: "Notes laissées par vos clients",
    icon: "reviews",
    group: "clients",
    permission: "reviews.manage",
  },
  {
    href: "/tableau-de-bord/cartes-cadeaux",
    bookingModule: true,
    label: "Cartes cadeaux",
    hint: "Vendez en ligne, encaissez avant la visite",
    icon: "gift",
    group: "clients",
    permission: "appointments.manage_own",
  },
  {
    href: "/tableau-de-bord/services",
    bookingModule: true,
    label: "Prestations",
    hint: "Ce que vous proposez : durée et prix",
    icon: "scissors",
    group: "salon",
    permission: "services.manage",
  },
  {
    href: "/tableau-de-bord/equipe",
    bookingModule: true,
    label: "Employés",
    hint: "Votre équipe et ses horaires",
    icon: "team",
    group: "salon",
    permission: "team.view",
  },
  {
    href: "/tableau-de-bord/parametres",
    label: "Paramètres",
    hint: "Ton projet et ton compte",
    icon: "settings",
    group: "compte",
  },
  {
    href: "/tableau-de-bord/statistiques",
    bookingModule: true,
    label: "Statistiques",
    hint: "Chiffre d'affaires et fréquentation",
    icon: "chart",
    group: "suivi",
    permission: "stats.view",
  },
  {
    href: "/tableau-de-bord/analyses",
    bookingModule: true,
    label: "Conseils",
    hint: "Recommandations pour remplir votre agenda",
    icon: "insights",
    group: "suivi",
    permission: "stats.view",
  },
  {
    href: "/tableau-de-bord/autopilot",
    bookingModule: true,
    label: "Automatisations",
    hint: "Confirmations, rappels, demandes d'avis",
    icon: "autopilot",
    group: "suivi",
    permission: "autopilot.view",
  },
  {
    href: "/tableau-de-bord/assistant",
    label: "Assistant IA",
    hint: "Vos questions de marketing et de vente",
    icon: "assistant",
    group: "marketing",
    permission: "marketing.manage",
    requiresAssistant: true,
  },
  {
    href: "/tableau-de-bord/notifications",
    bookingModule: true,
    label: "Notifications",
    hint: "Nouvelles réservations et annulations",
    icon: "bell",
    group: "suivi",
  },
  {
    href: "/tableau-de-bord/abonnement",
    label: "Abonnement",
    hint: "Votre forfait et vos factures",
    icon: "card",
    group: "compte",
    permission: "billing.manage",
  },
];

/** Entrées regroupées par section (sections vides retirées). */
export function groupNavItems(items: NavItem[]) {
  return NAV_GROUPS.map((g) => ({ ...g, items: items.filter((i) => i.group === g.id) })).filter(
    (g) => g.items.length > 0,
  );
}

export function isActive(pathname: string, href: string) {
  if (href === "/tableau-de-bord") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
