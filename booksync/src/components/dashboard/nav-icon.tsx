import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  Hourglass,
  LayoutDashboard,
  MessageSquareText,
  Lightbulb,
  ListChecks,
  Scissors,
  Settings,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import type { NavItem } from "./nav-config";

const ICONS = {
  home: LayoutDashboard,
  calendar: CalendarDays,
  list: ListChecks,
  users: UserRound,
  scissors: Scissors,
  team: Users,
  bell: Bell,
  chart: BarChart3,
  settings: Settings,
  card: CreditCard,
  autopilot: Sparkles,
  waitlist: Hourglass,
  insights: Lightbulb,
  assistant: MessageSquareText,
} as const;

export function NavIcon({ name, className }: { name: NavItem["icon"]; className?: string }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden className={className ?? "size-[18px]"} />;
}
