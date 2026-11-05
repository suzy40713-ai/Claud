"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/settings/image-upload";
import { SettingsSection } from "@/components/settings/section";
import { useSave } from "@/components/settings/use-save";
import { ACTIVITIES } from "@/domain/activities";
import { PREFERRED_TIMEZONES } from "@/domain/organization/timezones";
import { updateOrganizationInfoAction, uploadOrganizationImageAction } from "../actions";

type Values = {
  name: string;
  slug: string;
  activity: string;
  description: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  timezone: string;
};

const COUNTRIES = [
  ["FR", "France"],
  ["BE", "Belgique"],
  ["CH", "Suisse"],
  ["LU", "Luxembourg"],
  ["MC", "Monaco"],
  ["CA", "Canada"],
  ["MA", "Maroc"],
  ["TN", "Tunisie"],
  ["SN", "Sénégal"],
  ["CI", "Côte d'Ivoire"],
] as const;

export function CompanyForm({ initial, logoUrl, publicBaseUrl }: { initial: Values; logoUrl: string | null; publicBaseUrl: string }) {
  const [v, setV] = useState(initial);
  const { pending, errors, save } = useSave();
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="grid gap-8">
      <SettingsSection title="Logo" description="Affiché sur votre page de réservation et dans les emails envoyés à vos clients.">
        <ImageUpload
          label="Logo de l'entreprise"
          url={logoUrl}
          onUpload={(fd) => {
            fd.set("kind", "logo");
            return uploadOrganizationImageAction(fd);
          }}
          onRemove={() => {
            const fd = new FormData();
            fd.set("kind", "logo");
            return uploadOrganizationImageAction(fd);
          }}
        />
      </SettingsSection>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(() => updateOrganizationInfoAction(v));
        }}
        className="grid gap-8"
        noValidate
      >
        <SettingsSection title="Informations générales" description="Le nom et l'adresse publique de votre page de réservation.">
          <div className="grid gap-5">
            <Field id="name" label="Nom de l'entreprise" error={errors.name}>
              <Input id="name" value={v.name} onChange={set("name")} required />
            </Field>
            <Field id="slug" label="Adresse de la page de réservation" error={errors.slug} hint="Modifier l'adresse rend l'ancien lien inactif.">
              <div className="flex h-10 w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-card shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25 sm:h-9">
                <span className="shrink-0 border-r bg-muted px-3 text-[13px] leading-10 text-muted-foreground sm:leading-9">
                  {publicBaseUrl}/
                </span>
                <input
                  id="slug"
                  value={v.slug}
                  onChange={(e) => setV((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none sm:text-sm"
                />
              </div>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="activity" label="Activité" error={errors.activity}>
                <NativeSelect id="activity" value={v.activity} onChange={set("activity")}>
                  {ACTIVITIES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field id="timezone" label="Fuseau horaire" error={errors.timezone}>
                <NativeSelect id="timezone" value={v.timezone} onChange={set("timezone")}>
                  {PREFERRED_TIMEZONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field id="description" label="Présentation (facultatif)" error={errors.description} hint="600 caractères maximum. Visible sur votre page de réservation.">
              <Textarea id="description" value={v.description} onChange={set("description")} maxLength={600} />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection title="Coordonnées" description="Facultatives. Affichées à vos clients pour vous contacter et vous trouver.">
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="email" label="Email de contact" error={errors.email}>
                <Input id="email" type="email" inputMode="email" value={v.email} onChange={set("email")} placeholder="contact@entreprise.fr" />
              </Field>
              <Field id="phone" label="Téléphone" error={errors.phone}>
                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={set("phone")} placeholder="01 23 45 67 89" />
              </Field>
            </div>
            <Field id="addressLine1" label="Adresse" error={errors.addressLine1}>
              <Input id="addressLine1" autoComplete="address-line1" value={v.addressLine1} onChange={set("addressLine1")} placeholder="12 rue de la Paix" />
            </Field>
            <Field id="addressLine2" label="Complément d'adresse" error={errors.addressLine2}>
              <Input id="addressLine2" autoComplete="address-line2" value={v.addressLine2} onChange={set("addressLine2")} placeholder="Bâtiment, étage…" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-[140px_1fr_180px]">
              <Field id="postalCode" label="Code postal" error={errors.postalCode}>
                <Input id="postalCode" autoComplete="postal-code" inputMode="numeric" value={v.postalCode} onChange={set("postalCode")} />
              </Field>
              <Field id="city" label="Ville" error={errors.city}>
                <Input id="city" autoComplete="address-level2" value={v.city} onChange={set("city")} />
              </Field>
              <Field id="country" label="Pays" error={errors.country}>
                <NativeSelect id="country" value={v.country} onChange={set("country")}>
                  {COUNTRIES.map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </div>
        </SettingsSection>

        <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
          <Button type="submit" size="lg" disabled={pending} className="w-full shadow-md sm:w-auto">
            {pending ? <Spinner /> : null}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
