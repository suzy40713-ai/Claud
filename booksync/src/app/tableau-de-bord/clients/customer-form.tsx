"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { saveCustomerAction } from "./actions";

export type CustomerValues = { firstName: string; lastName: string; email: string; phone: string; notes: string; emailOptIn: boolean };

export function CustomerForm({ id, initial, onSaved }: { id: string | null; initial?: CustomerValues; onSaved: (id: string) => void }) {
  const [v, setV] = useState<CustomerValues>(initial ?? { firstName: "", lastName: "", email: "", phone: "", notes: "", emailOptIn: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof CustomerValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <DialogContent title={id ? "Modifier le client" : "Nouveau client"}>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const res = await saveCustomerAction(id, v);
            if (!res.ok) {
              setErrors(res.fieldErrors ?? {});
              setError(res.error);
              return;
            }
            onSaved(res.data.id);
          });
        }}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="grid grid-cols-2 gap-3">
          <Field id="c-first" label="Prénom" error={errors.firstName}>
            <Input id="c-first" value={v.firstName} onChange={set("firstName")} autoComplete="off" />
          </Field>
          <Field id="c-last" label="Nom" error={errors.lastName}>
            <Input id="c-last" value={v.lastName} onChange={set("lastName")} autoComplete="off" />
          </Field>
        </div>
        <Field id="c-email" label="Email" error={errors.email}>
          <Input id="c-email" type="email" inputMode="email" value={v.email} onChange={set("email")} autoComplete="off" />
        </Field>
        <Field id="c-phone" label="Téléphone" error={errors.phone}>
          <Input id="c-phone" type="tel" inputMode="tel" value={v.phone} onChange={set("phone")} autoComplete="off" />
        </Field>
        <Field id="c-notes" label="Notes internes" hint="Préférences, informations pratiques. N'y saisissez aucune donnée de santé." error={errors.notes}>
          <Textarea id="c-notes" value={v.notes} onChange={set("notes")} maxLength={2000} />
        </Field>
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox checked={v.emailOptIn} onCheckedChange={(c) => setV({ ...v, emailOptIn: c === true })} className="mt-0.5" />
          Le client accepte de recevoir les emails de confirmation et de rappel.
        </label>
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? <Spinner /> : null}
          {id ? "Enregistrer" : "Créer le client"}
        </Button>
      </form>
    </DialogContent>
  );
}
