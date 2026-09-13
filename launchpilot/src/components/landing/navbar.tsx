"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#generation", label: "Ce qu'on génère" },
  { href: "#tarifs", label: "Tarifs" },
];

export function Navbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/signup">Créer mon plan</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <Button asChild variant="ghost" className="flex-1">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild variant="brand" className="flex-1">
                <Link href="/signup">Créer mon compte</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
