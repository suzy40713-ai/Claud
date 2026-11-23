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
    | "booster";
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

export type NavGroup = "accueil" | "marketing" | "rdv" | "clients" | "salon" | "suivi" | "compte";

/** Sections du menu, dans l'ordre d'affichage (titre vide = pas de titre). */
export const NAV_GROUPS: Array<{ id: NavGroup; title: string }> = [
  { id: "accueil", title: "" },
  { id: "marketing", title: "Marketing" },
  { id: "rdv", title: "Module rendez-vous" },
  { id: "clients", title: "Clients et ventes" },
  { id: "salon", title: "Mon activité" },
  { id: "suivi", title: "Suivi et automatisations" },
  { id: "compte", title: "Compte" },
];

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/tableau-de-bord",
    label: "Vue générale",
    hint: "Votre journée en un coup d'œil",
    icon: "home",
    group: "accueil",
    mobile: true,
  },
  {
    href: "/tableau-de-bord/produits",
    label: "Mes produits",
    hint: "Ce que vous vendez, base de vos analyses",
    icon: "package",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/analyse-ia",
    label: "Analyse IA",
    hint: "Forces, cibles et angles de vente de vos produits",
    icon: "analysis",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/strategies",
    label: "Stratégies",
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
    label: "Contenus",
    hint: "Scripts vidéo, carrousels et posts",
    icon: "content",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/sales-booster",
    label: "Sales Booster",
    hint: "Plus d'acheteurs parmi vos visiteurs",
    icon: "booster",
    group: "marketing",
    permission: "marketing.manage",
  },
  {
    href: "/tableau-de-bord/calendrier",
    bookingModule: true,
    label: "Calendrier",
    hint: "Votre agenda jour par jour",
    icon: "calendar",
    group: "rdv",
    mobile: true,
  },
  {
    href: "/tableau-de-bord/reservations",
    bookingModule: true,
    label: "Réservations",
    hint: "Liste de tous les rendez-vous",
    icon: "list",
    group: "rdv",
    mobile: true,
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
    label: "Employés",
    hint: "Votre équipe et ses horaires",
    icon: "team",
    group: "salon",
    permission: "team.view",
  },
  {
    href: "/tableau-de-bord/parametres",
    label: "Paramètres",
    hint: "Horaires, page de réservation, acompte",
    icon: "settings",
    group: "salon",
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
    label: "Assistant",
    hint: "Posez vos questions sur votre activité",
    icon: "assistant",
    group: "suivi",
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
