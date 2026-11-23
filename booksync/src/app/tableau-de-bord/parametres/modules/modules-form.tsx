"use client";

import { useState } from "react";
import { CalendarCheck2 } from "lucide-react";
import { useSave } from "@/components/settings/use-save";
import { Switch } from "@/components/ui/switch";
import { setBookingModuleAction } from "../actions";

export function ModulesForm({ bookingModule }: { bookingModule: boolean }) {
  const [on, setOn] = useState(bookingModule);
  const { pending, save } = useSave();
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex gap-3">
        <CalendarCheck2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Module rendez-vous</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pour vendre des services sur rendez-vous : page de réservation, agenda, paiement en
            ligne, cartes cadeaux, avis. Désactivé, ces menus sont masqués ; vos données sont
            conservées et votre page de réservation reste en ligne.
          </p>
        </div>
      </div>
      <Switch
        checked={on}
        disabled={pending}
        aria-label="Module rendez-vous"
        onCheckedChange={(v) => {
          setOn(v);
          save(() => setBookingModuleAction(v));
        }}
      />
    </div>
  );
}
