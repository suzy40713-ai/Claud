"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { slugify } from "@/domain/organization/slug";
import { PREFERRED_TIMEZONES } from "@/domain/organization/timezones";
import { checkSlugAvailability, createOrganizationAction, type OnboardingState } from "./actions";

export function OnboardingForm({ publicBaseUrl }: { publicBaseUrl: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createOrganizationAction,
    {},
  );
  const [name, setName] = useState(state.values?.name ?? "");
  const [slug, setSlug] = useState(state.values?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(state.values?.slug));
  const [slugCheck, setSlugCheck] = useState<{ slug: string; error: string | null } | null>(null);
  const [timezone, setTimezone] = useState(state.values?.timezone ?? "Europe/Paris");
  const [timezoneTouched, setTimezoneTouched] = useState(Boolean(state.values?.timezone));

  // Vérification de disponibilité de l'adresse, avec un léger délai pendant la frappe.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const error = await checkSlugAvailability(slug);
      if (!cancelled) setSlugCheck({ slug, error });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  const liveSlugError = slug && slugCheck?.slug === slug ? slugCheck.error : null;
  const shownSlugError = liveSlugError ?? (slug === state.values?.slug ? state.errors?.slug : null);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
    // Fuseau du navigateur proposé automatiquement s'il fait partie de la liste.
    if (!timezoneTouched) {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (PREFERRED_TIMEZONES.some((tz) => tz.value === browserTz)) setTimezone(browserTz);
    }
  }

  return (
    <form action={formAction} noValidate className="grid gap-5">
      {state.formError ? <Alert variant="error">{state.formError}</Alert> : null}
      <Field id="name" label="Nom de l'entreprise" error={state.errors?.name}>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Cabinet Martin"
          autoComplete="organization"
          required
        />
      </Field>
      <Field
        id="slug"
        label="Adresse de votre page de réservation"
        hint="Lettres minuscules, chiffres et tirets."
        error={shownSlugError}
      >
        <div className="flex h-10 w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-card shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25 sm:h-9">
          <span className="shrink-0 border-r bg-muted px-3 text-[13px] leading-10 text-muted-foreground sm:leading-9">
            {publicBaseUrl}/
          </span>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="cabinet-martin"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none sm:text-sm"
            required
          />
        </div>
      </Field>
      <Field id="timezone" label="Fuseau horaire" error={state.errors?.timezone}>
        <NativeSelect
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => {
            setTimezoneTouched(true);
            setTimezone(e.target.value);
          }}
        >
          {PREFERRED_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Spinner /> : null}
        Créer mon entreprise
      </Button>
    </form>
  );
}
