"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createOrganizationAction, type OnboardingState } from "./actions";

const STAGES = [
  ["idee", "Je n'ai pas encore d'idée : aide-moi à trouver quoi vendre"],
  ["produit", "J'ai déjà quelque chose à vendre (produit, service, formation…)"],
] as const;

export function OnboardingForm({
  initial,
}: {
  initial?: { name?: string; stage?: string; idea?: string };
}) {
  const [state, formAction, pending] = useActionState<OnboardingState | null, FormData>(
    createOrganizationAction,
    null,
  );
  const fieldErrors: Record<string, string> = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError =
    state && !state.ok && !fieldErrors.name ? state.error : null;
  const [name, setName] = useState(state?.values?.name ?? initial?.name ?? "");
  const stage = state?.values?.stage ?? initial?.stage ?? "idee";

  return (
    <form action={formAction} noValidate className="grid gap-5">
      {initial?.idea ? <input type="hidden" name="idee" value={initial.idea} /> : null}
      {formError ? <Alert variant="error">{formError}</Alert> : null}
      <Field
        id="name"
        label="Nom de ton projet"
        hint="Ton prénom suffit si tu n'as pas encore de nom. Tu pourras le changer."
        error={fieldErrors.name}
      >
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Le projet de Léa"
          autoComplete="organization"
          required
        />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Où en es-tu ?</legend>
        {STAGES.map(([v, label]) => (
          <label
            key={v}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
          >
            <input
              type="radio"
              name="stage"
              value={v}
              defaultChecked={stage === v}
              className="accent-[var(--primary)]"
            />
            {label}
          </label>
        ))}
      </fieldset>
      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Spinner /> : null}
        C&apos;est parti
      </Button>
    </form>
  );
}
