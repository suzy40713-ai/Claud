import {
  LayoutDashboard,
  Package,
  Target,
  Sparkles,
  CalendarDays,
  Users,
  Mail,
  Megaphone,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/produit", label: "Mon produit", icon: Package },
  { href: "/dashboard/strategie", label: "Stratégie", icon: Target },
  { href: "/dashboard/contenu", label: "Contenu", icon: Sparkles },
  { href: "/dashboard/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/dashboard/premiers-clients", label: "Premiers clients", icon: Users },
  { href: "/dashboard/emails", label: "Emails", icon: Mail },
  { href: "/dashboard/publicites", label: "Publicités", icon: Megaphone },
  { href: "/dashboard/rapports", label: "Rapports", icon: FileBarChart },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
];
