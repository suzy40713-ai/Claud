"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Shield } from "lucide-react";

import { NAV_ACCOUNT, NAV_LIBRARY, NAV_MAIN, type NavItem } from "@/components/app/nav";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

function NavLink({ item, features, onNavigate }: { item: NavItem; features: string[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const locked = item.feature && !features.includes(item.feature);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-tour={item.tourId}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4", active && "text-violet-400")} />
      <span className="flex-1">{item.label}</span>
      {locked && <Lock className="h-3 w-3 opacity-60" aria-label="Formule supérieure requise" />}
    </Link>
  );
}

function Group({ title, items, features, onNavigate }: { title?: string; items: NavItem[]; features: string[]; onNavigate?: () => void }) {
  return (
    <div className="space-y-0.5">
      {title && <p className="px-2.5 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{title}</p>}
      {items.map((item) => (
        <NavLink key={item.href} item={item} features={features} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function SidebarContent({ features, isAdmin, onNavigate }: { features: string[]; isAdmin: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Logo href="/app" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Navigation de l'application">
        <Group items={NAV_MAIN} features={features} onNavigate={onNavigate} />
        <Group title="Bibliothèque" items={NAV_LIBRARY} features={features} onNavigate={onNavigate} />
        <Group title="Compte" items={NAV_ACCOUNT} features={features} onNavigate={onNavigate} />
        {isAdmin && (
          <Group title="Administration" items={[{ href: "/admin", label: "Admin", icon: Shield }]} features={features} onNavigate={onNavigate} />
        )}
      </nav>
    </div>
  );
}
