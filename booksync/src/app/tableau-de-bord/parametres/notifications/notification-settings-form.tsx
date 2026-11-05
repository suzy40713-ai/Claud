"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { SettingsSection, UpgradeNotice } from "@/components/settings/section";
import { useSave } from "@/components/settings/use-save";
import type { PlanFeatures } from "@/domain/billing/plans";
import { updateNotificationSettingsAction } from "../actions";

function Row({
  title,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {title}
          {badge ? <Badge variant="primary">{badge}</Badge> : null}
        </span>
        <span className="block text-[13px] text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </label>
  );
}

export function NotificationSettingsForm({
  initial,
  features,
  planName,
}: {
  initial: { notifyStaffOnBooking: boolean; reminder24h: boolean; reminder2h: boolean };
  features: PlanFeatures;
  planName: string;
}) {
  const [v, setV] = useState(initial);
  const { pending, save } = useSave();
  return (
    <form
      className="grid gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        save(() => updateNotificationSettingsAction(v));
      }}
    >
      <SettingsSection
        title="Emails à vos clients"
        description="Envoyés automatiquement à chaque réservation, modification ou annulation."
      >
        <div className="grid gap-4">
          <div className="divide-y">
            <Row
              title="Confirmation, modification et annulation"
              description="Email envoyé au client avec le récapitulatif et son lien de gestion du rendez-vous."
              checked={features.emailNotifications}
              disabled
              badge={features.emailNotifications ? undefined : "Starter"}
            />
            <Row
              title="Rappel 24 heures avant"
              description="Réduit fortement les rendez-vous oubliés."
              checked={features.automaticReminders && v.reminder24h}
              disabled={!features.automaticReminders}
              onChange={(c) => setV((p) => ({ ...p, reminder24h: c }))}
              badge={features.automaticReminders ? undefined : "Pro"}
            />
            <Row
              title="Rappel 2 heures avant"
              description="Un dernier rappel le jour même."
              checked={features.automaticReminders && v.reminder2h}
              disabled={!features.automaticReminders}
              onChange={(c) => setV((p) => ({ ...p, reminder2h: c }))}
              badge={features.automaticReminders ? undefined : "Pro"}
            />
          </div>
          {!features.emailNotifications ? (
            <UpgradeNotice feature="Les emails de confirmation à vos clients" plan="Starter" />
          ) : !features.automaticReminders ? (
            <UpgradeNotice feature="Les rappels automatiques" />
          ) : null}
          <p className="text-[13px] text-muted-foreground">Forfait actuel : {planName}.</p>
        </div>
      </SettingsSection>
      <SettingsSection
        title="Votre équipe"
        description="Alertes envoyées à l'employé concerné, au propriétaire et aux administrateurs."
      >
        <Row
          title="Nouvelle réservation et annulation"
          description="Notification dans BookSync et, avec un forfait payant, par email."
          checked={v.notifyStaffOnBooking}
          onChange={(c) => setV((p) => ({ ...p, notifyStaffOnBooking: c }))}
        />
      </SettingsSection>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? <Spinner /> : null}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
