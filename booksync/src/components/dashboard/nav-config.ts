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
    | "waitlist";
  permission?: Permission;
  /** Affiché dans la barre d'onglets mobile */
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/tableau-de-bord", label: "Vue générale", icon: "home", mobile: true },
  { href: "/tableau-de-bord/calendrier", label: "Calendrier", icon: "calendar", mobile: true },
  { href: "/tableau-de-bord/reservations", label: "Réservations", icon: "list", mobile: true },
  {
    href: "/tableau-de-bord/clients",
    label: "Clients",
    icon: "users",
    permission: "customers.view_all",
    mobile: true,
  },
  {
    href: "/tableau-de-bord/services",
    label: "Services",
    icon: "scissors",
    permission: "services.manage",
  },
  { href: "/tableau-de-bord/equipe", label: "Employés", icon: "team", permission: "team.view" },
  {
    href: "/tableau-de-bord/autopilot",
    label: "Autopilot",
    icon: "autopilot",
    permission: "autopilot.view",
  },
  {
    href: "/tableau-de-bord/liste-attente",
    label: "Liste d'attente",
    icon: "waitlist",
    permission: "customers.view_all",
  },
  { href: "/tableau-de-bord/notifications", label: "Notifications", icon: "bell" },
  {
    href: "/tableau-de-bord/statistiques",
    label: "Statistiques",
    icon: "chart",
    permission: "stats.view",
  },
  { href: "/tableau-de-bord/parametres", label: "Paramètres", icon: "settings" },
  {
    href: "/tableau-de-bord/abonnement",
    label: "Abonnement",
    icon: "card",
    permission: "billing.manage",
  },
];

export function isActive(pathname: string, href: string) {
  if (href === "/tableau-de-bord") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
