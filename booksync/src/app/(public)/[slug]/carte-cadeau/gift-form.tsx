"use client";

import { useState, useTransition } from "react";
import { Gift, Lock } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { euros, GIFT_MESSAGE_MAX } from "@/domain/billing/gift-card";
import { cn } from "@/lib/utils";
import { buyGiftCardAction } from "./actions";

export function GiftForm({ slug, amounts }: { slug: string; amounts: number[] }) {
  const [amount, setAmount] = useState(amounts[Math.min(1, amounts.length - 1)] ?? amounts[0]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await buyGiftCardAction(slug, {
        amountCents: amount,
        buyerName: f.buyerName ?? "",
        buyerEmail: f.buyerEmail ?? "",
        recipientName: f.recipientName ?? "",
        message: f.message ?? "",
        website: f.website ?? "",
      });
      if (!res.ok) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      window.location.assign(res.data);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Montant</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Montant de la carte">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={a === amount}
              onClick={() => setAmount(a)}
              className={cn(
                "h-14 rounded-xl border text-lg font-semibold transition-colors",
                a === amount
                  ? "border-primary bg-primary-soft text-primary-soft-foreground ring-2 ring-primary"
                  : "bg-card hover:bg-subtle",
              )}
            >
              {euros(a)}
            </button>
          ))}
        </div>
      </fieldset>
      <Field id="recipientName" label="Pour qui ?" error={fieldErrors.recipientName}>
        <Input
          id="recipientName"
          name="recipientName"
          placeholder="Prénom de la personne"
          required
        />
      </Field>
      <Field
        id="message"
        label="Petit mot (facultatif)"
        hint={`${GIFT_MESSAGE_MAX} caractères maximum, affiché sur la carte.`}
        error={fieldErrors.message}
      >
        <Textarea
          id="message"
          name="message"
          rows={3}
          maxLength={GIFT_MESSAGE_MAX}
          placeholder="Joyeux anniversaire ! Fais-toi plaisir 💇‍♀️"
        />
      </Field>
      <Field id="buyerName" label="Votre nom" error={fieldErrors.buyerName}>
        <Input id="buyerName" name="buyerName" autoComplete="name" required />
      </Field>
      <Field
        id="buyerEmail"
        label="Votre email"
        hint="Vous y recevez la carte à imprimer ou à transférer."
        error={fieldErrors.buyerEmail}
      >
        <Input
          id="buyerEmail"
          name="buyerEmail"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </Field>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner /> : <Gift />} Payer {euros(amount)}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="size-3.5" /> Paiement sécurisé par Stripe, versé directement au salon.
      </p>
    </form>
  );
}
