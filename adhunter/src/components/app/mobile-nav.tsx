"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { SidebarContent } from "@/components/app/sidebar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({ features, isAdmin }: { features: string[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="rounded-md p-2 text-muted-foreground hover:text-foreground lg:hidden" aria-label="Ouvrir le menu">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-background p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarContent features={features} isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
