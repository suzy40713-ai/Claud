"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/subscriptions", label: "Abonnements" },
  { href: "/admin/plans", label: "Offres & limites" },
  { href: "/admin/features", label: "Fonctionnalités" },
  { href: "/admin/errors", label: "Erreurs" },
  { href: "/admin/messages", label: "Messages" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Navigation administration">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={cn("whitespace-nowrap border-b-2 px-3 py-2.5 text-sm", active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
