"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, LogOut, Settings, ChevronDown, Zap } from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarNav } from "./sidebar-nav";
import { signOut } from "@/lib/actions/auth";

export function DashboardShell({
  children,
  userEmail,
  userName,
  plan,
  creditsRemaining,
  creditsLimit,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string | null;
  plan: "free" | "pro";
  creditsRemaining: number;
  creditsLimit: number;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const initials = (userName || userEmail).slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav />
        </div>
        <div className="border-t border-border p-4">
          <UpgradeCard plan={plan} creditsRemaining={creditsRemaining} creditsLimit={creditsLimit} />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex h-16 items-center border-b border-border px-6">
            <Logo />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="border-t border-border p-4">
            <UpgradeCard plan={plan} creditsRemaining={creditsRemaining} creditsLimit={creditsLimit} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Badge variant="secondary" className="hidden sm:flex">
              <Zap className="h-3 w-3" />
              {creditsRemaining}/{creditsLimit} générations restantes
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[10rem] truncate text-sm sm:inline">{userName || userEmail}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="truncate font-medium">{userName || "Mon compte"}</p>
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/parametres">
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <button type="submit" className="flex w-full items-center gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function UpgradeCard({
  plan,
  creditsRemaining,
  creditsLimit,
}: {
  plan: "free" | "pro";
  creditsRemaining: number;
  creditsLimit: number;
}) {
  if (plan === "pro") {
    return (
      <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
        Forfait Pro · {creditsRemaining}/{creditsLimit} plans restants ce mois-ci
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <p className="text-sm font-medium">Forfait Free</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {creditsRemaining}/{creditsLimit} plan{creditsLimit > 1 ? "s" : ""} restant ce mois-ci
      </p>
      <Button asChild size="sm" variant="brand" className="mt-3 w-full">
        <Link href="/dashboard/parametres?tab=abonnement">Passer en Pro</Link>
      </Button>
    </div>
  );
}
