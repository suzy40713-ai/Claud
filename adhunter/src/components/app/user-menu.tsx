"use client";

import Link from "next/link";
import { CreditCard, LogOut, Settings, Shield } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";

export function UserMenu({ email, name, planName, isAdmin }: { email: string; name: string | null; planName: string; isAdmin: boolean }) {
  const initials = (name || email).slice(0, 2).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Menu du compte">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-xs font-medium text-violet-400">{initials}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{name || "Mon compte"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="mt-1 text-xs text-violet-400">Formule {planName}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/app/settings"><Settings className="mr-2 h-4 w-4" />Paramètres</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/app/billing"><CreditCard className="mr-2 h-4 w-4" />Abonnement</Link></DropdownMenuItem>
        {isAdmin && <DropdownMenuItem asChild><Link href="/admin"><Shield className="mr-2 h-4 w-4" />Administration</Link></DropdownMenuItem>}
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full"><LogOut className="mr-2 h-4 w-4" />Se déconnecter</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
