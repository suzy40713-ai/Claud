"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/shared/submit-button";
import { FormMessage } from "@/components/shared/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage, type ContactState } from "@/lib/actions/contact";

export function ContactForm() {
  const [state, action] = useActionState<ContactState, FormData>(sendContactMessage, {});
  if (state.success) return <FormMessage type="success">{state.success}</FormMessage>;
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Objet</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={6} required />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="consent" className="mt-0.5 accent-[#7657FF]" required />
        <span>J'accepte que mes données soient utilisées pour répondre à ma demande (voir la <Link href="/legal/confidentialite" className="underline">politique de confidentialité</Link>).</span>
      </label>
      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      <SubmitButton className="w-full">Envoyer</SubmitButton>
    </form>
  );
}
