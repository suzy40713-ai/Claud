"use client";

import Link from "next/link";
import { Bell, Search, Shield } from "lucide-react";

export default function TopBar() {
  return (
    <header className="glass sticky top-0 z-40 flex items-center justify-between border-b border-surface-border px-4 py-3 lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dim text-[#04150c]">
          <Shield className="h-4 w-4" fill="currentColor" strokeWidth={0} />
        </div>
        <span className="font-display text-base font-bold">
          Club Pro <span className="text-gradient-accent">FC27</span>
        </span>
      </Link>
      <div className="flex items-center gap-1">
        <Link href="/recrutement" className="rounded-full p-2 text-muted hover:bg-white/10 hover:text-foreground">
          <Search className="h-5 w-5" />
        </Link>
        <button className="relative rounded-full p-2 text-muted hover:bg-white/10 hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-live" />
        </button>
      </div>
    </header>
  );
}
