"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Mail, Search, Shield, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export default function DesktopTopBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/recrutement?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="glass sticky top-0 z-40 hidden h-14 items-center gap-4 border-b border-surface-border px-5 lg:flex">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dim text-[#04150c]">
          <Shield className="h-4.5 w-4.5" fill="currentColor" strokeWidth={0} />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">Club Pro</span>
        <span className="rounded-md bg-gradient-to-r from-gold to-amber-400 px-1.5 py-0.5 font-display text-xs font-extrabold text-[#241a02]">
          FC 27
        </span>
      </Link>

      <form onSubmit={submit} className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-2 rounded-full border border-surface-border bg-surface-2 px-3.5 py-1.5 text-sm focus-within:border-accent/40">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher joueurs, clubs, tournois..."
            className="w-full bg-transparent placeholder:text-muted focus:outline-none"
          />
        </div>
      </form>

      <div className="flex shrink-0 items-center gap-1">
        <Link href="/recrutement" className="rounded-full p-2 text-muted hover:bg-white/10 hover:text-foreground">
          <Users className="h-5 w-5" />
        </Link>
        <Link href="/messages" className="relative rounded-full p-2 text-muted hover:bg-white/10 hover:text-foreground">
          <Mail className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-live" />
        </Link>
        <Link href="/notifications" className="rounded-full p-2 text-muted hover:bg-white/10 hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Link>
        <Link href="/joueur/moi" className="ml-1 shrink-0">
          <Avatar type="joueur" nom="VousMeme" seed="moi" size="sm" />
        </Link>
      </div>
    </header>
  );
}
