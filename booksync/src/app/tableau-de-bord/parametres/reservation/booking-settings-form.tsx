"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/settings/image-upload";
import { SettingsSection, UpgradeNotice } from "@/components/settings/section";
import { useSave } from "@/components/settings/use-save";
import { CopyButton } from "@/components/ui/copy-button";
import { updateBookingSettingsAction, updateBrandingAction, uploadOrganizationImageAction } from "../actions";

const NOTICE = [
  [0, "Aucun délai"],
  [30, "30 minutes"],
  [60, "1 heure"],
  [120, "2 heures"],
  [240, "4 heures"],
  [720, "12 heures"],
  [1440, "24 heures"],
  [2880, "48 heures"],
] as const;
const ADVANCE = [7, 14, 30, 60, 90, 180, 365] as const;
const CANCEL = [0, 2, 12, 24, 48, 72] as const;

export function BookingSettingsForm({
  publicUrl,
  initial,
  branding,
  canCustomize,
  coverUrl,
}: {
  publicUrl: string;
  initial: {
    bookingEnabled: boolean;
    minNoticeMinutes: number;
    maxAdvanceDays: number;
    slotIntervalMinutes: number;
    cancellationNoticeHours: number;
  };
  branding: { brandColor: string; welcomeMessage: string };
  canCustomize: boolean;
  coverUrl: string | null;
}) {
  const [v, setV] = useState(initial);
  const [b, setB] = useState(branding);
  const settings = useSave();
  const brand = useSave();
  const num = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: Number(e.target.value) }));

  return (
    <div className="grid gap-8">
      <SettingsSection title="Votre page de réservation" description="Partagez ce lien avec vos clients : sur votre site, vos réseaux sociaux ou par message.">
        <div className="grid gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-subtle px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-[13px]" data-testid="public-url">
              {publicUrl}
            </span>
            <CopyButton value={publicUrl} />
          </div>
          <Button asChild variant="secondary" className="w-full sm:w-auto sm:justify-self-start">
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink /> Ouvrir ma page
            </a>
          </Button>
        </div>
      </SettingsSection>

      <form
        className="grid gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          settings.save(() => updateBookingSettingsAction(v));
        }}
      >
        <SettingsSection title="Règles de réservation" description="Elles s'appliquent à toutes les réservations faites en ligne par vos clients.">
          <div className="grid gap-5">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Réservation en ligne activée</span>
                <span className="block text-[13px] text-muted-foreground">Désactivez-la pour suspendre temporairement les réservations.</span>
              </span>
              <Switch checked={v.bookingEnabled} onCheckedChange={(c) => setV((p) => ({ ...p, bookingEnabled: c }))} aria-label="Réservation en ligne activée" />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="minNotice" label="Délai minimum avant un rendez-vous" error={settings.errors.minNoticeMinutes}>
                <NativeSelect id="minNotice" value={v.minNoticeMinutes} onChange={num("minNoticeMinutes")}>
                  {NOTICE.map(([m, l]) => (
                    <option key={m} value={m}>
                      {l}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field id="maxAdvance" label="Réservation possible jusqu'à" error={settings.errors.maxAdvanceDays}>
                <NativeSelect id="maxAdvance" value={v.maxAdvanceDays} onChange={num("maxAdvanceDays")}>
                  {ADVANCE.map((d) => (
                    <option key={d} value={d}>
                      {d} jours à l&apos;avance
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field id="interval" label="Intervalle entre les créneaux proposés" error={settings.errors.slotIntervalMinutes}>
                <NativeSelect id="interval" value={v.slotIntervalMinutes} onChange={num("slotIntervalMinutes")}>
                  {[5, 10, 15, 20, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      Toutes les {m} minutes
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field id="cancelNotice" label="Annulation ou modification par le client" error={settings.errors.cancellationNoticeHours}>
                <NativeSelect id="cancelNotice" value={v.cancellationNoticeHours} onChange={num("cancellationNoticeHours")}>
                  {CANCEL.map((h) => (
                    <option key={h} value={h}>
                      {h === 0 ? "Jusqu'au début du rendez-vous" : `Jusqu'à ${h} h avant`}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Button type="submit" disabled={settings.pending} className="sm:justify-self-end">
              {settings.pending ? <Spinner /> : null}
              Enregistrer
            </Button>
          </div>
        </SettingsSection>
      </form>

      <SettingsSection title="Personnalisation" description="Couleur, message d'accueil et visuel de couverture de votre page de réservation.">
        {canCustomize ? (
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              brand.save(() => updateBrandingAction(b));
            }}
          >
            <Field id="brandColor" label="Couleur principale" error={brand.errors.brandColor}>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Choisir la couleur"
                  value={b.brandColor}
                  onChange={(e) => setB((p) => ({ ...p, brandColor: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded-md border bg-card p-1"
                />
                <Input id="brandColor" value={b.brandColor} onChange={(e) => setB((p) => ({ ...p, brandColor: e.target.value }))} className="max-w-36 font-mono" />
              </div>
            </Field>
            <Field id="welcome" label="Message d'accueil" error={brand.errors.welcomeMessage} hint="300 caractères maximum.">
              <Textarea id="welcome" value={b.welcomeMessage} onChange={(e) => setB((p) => ({ ...p, welcomeMessage: e.target.value }))} maxLength={300} placeholder="Bienvenue ! Choisissez votre prestation et réservez en quelques secondes." />
            </Field>
            <div className="grid gap-2">
              <p className="text-sm font-medium">Visuel de couverture</p>
              <ImageUpload
                label="Visuel de couverture"
                shape="wide"
                url={coverUrl}
                hint="Format paysage conseillé (1800 × 700). 5 Mo maximum."
                onUpload={(fd) => {
                  fd.set("kind", "cover");
                  return uploadOrganizationImageAction(fd);
                }}
                onRemove={() => {
                  const fd = new FormData();
                  fd.set("kind", "cover");
                  return uploadOrganizationImageAction(fd);
                }}
              />
            </div>
            <Button type="submit" disabled={brand.pending} className="sm:justify-self-end">
              {brand.pending ? <Spinner /> : null}
              Enregistrer la personnalisation
            </Button>
          </form>
        ) : (
          <UpgradeNotice feature="La personnalisation de la page de réservation" />
        )}
      </SettingsSection>
    </div>
  );
}
