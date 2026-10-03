import {
  BarChart3,
  Bookmark,
  CreditCard,
  FolderOpen,
  History,
  LayoutDashboard,
  Library,
  Settings,
  Sparkles,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import type { FeatureKey } from "@/lib/plans";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  feature?: FeatureKey;
  tourId?: string;
}

export const NAV_MAIN: NavItem[] = [
  { href: "/app", label: "Tableau de bord", icon: LayoutDashboard, tourId: "dashboard" },
  { href: "/app/library", label: "Ad Library", icon: Library, tourId: "library" },
  { href: "/app/analyzer", label: "AI Analyzer", icon: Sparkles, tourId: "analyzer" },
  { href: "/app/creator", label: "Ad Creator", icon: Wand2, feature: "ad_creator", tourId: "creator" },
  { href: "/app/trends", label: "Trend Radar", icon: BarChart3, feature: "trend_radar", tourId: "trends" },
];

export const NAV_LIBRARY: NavItem[] = [
  { href: "/app/favorites", label: "Favoris", icon: Bookmark, tourId: "favorites" },
  { href: "/app/collections", label: "Collections", icon: FolderOpen },
  { href: "/app/history", label: "Historique", icon: History, feature: "search_history" },
];

export const NAV_ACCOUNT: NavItem[] = [
  { href: "/app/team", label: "Équipe", icon: Users, feature: "teams" },
  { href: "/app/billing", label: "Abonnement", icon: CreditCard },
  { href: "/app/settings", label: "Paramètres", icon: Settings },
];
