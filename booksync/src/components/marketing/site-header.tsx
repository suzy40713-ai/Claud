"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#avantages", label: "Avantages" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="BookSync — accueil" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Navigation du site" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href as Route}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/connexion">Se connecter</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/inscription">Commencer gratuitement</Link>
          </Button>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <div className={cn("border-t bg-background px-4 pb-5 md:hidden", open ? "block" : "hidden")}>
        <nav aria-label="Navigation mobile" className="grid py-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href as Route}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-3 text-[15px] font-medium"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="grid gap-2">
          <Button asChild size="lg">
            <Link href="/inscription">Commencer gratuitement</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/connexion">Se connecter</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
