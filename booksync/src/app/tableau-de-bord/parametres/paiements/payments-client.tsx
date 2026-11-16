"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useSave } from "@/components/settings/use-save";
import { computeDeposit, type DepositMode } from "@/domain/billing/deposit";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { disconnectStripeAction, startConnectAction, updateDepositAction } from "./actions";

export function ConnectButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await startConnectAction();
          if (res.ok) window.location.assign(res.data.url);
          else toast.error(res.error);
        })
      }
    >
      {pending ? <Spinner /> : <ExternalLink />}
      {label}
    </Button>
  );
}

export function DisconnectButton() {
  const { pending, save } = useSave();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          window.confirm(
            "Déconnecter votre compte Stripe ? Les acomptes ne seront plus demandés. Les acomptes déjà payés restent sur votre compte Stripe.",
          )
        )
          save(() => disconnectStripeAction());
      }}
    >
      Déconnecter
    </Button>
  );
}

const MODES: Array<{ value: DepositMode; label: string; sub: string }> = [
  { value: "none", label: "Pas d'acompte", sub: "Paiement intégral sur place" },
  { value: "fixed", label: "Montant fixe", sub: "Ex. 10 € par rendez-vous" },
  { value: "percent", label: "Pourcentage", sub: "Ex. 30 % du prix" },
];

export function DepositForm({
  initial,
  cancellationNoticeHours,
}: {
  initial: { mode: DepositMode; value: number };
  cancellationNoticeHours: number;
}) {
  const [mode, setMode] = useState<DepositMode>(initial.mode);
  const [fixed, setFixed] = useState(
    initial.mode === "fixed" ? String(initial.value / 100).replace(".", ",") : "10",
  );
  const [percent, setPercent] = useState(initial.mode === "percent" ? String(initial.value) : "30");
  const { pending, errors, save } = useSave();
  const value = mode === "fixed" ? Number(fixed.replace(",", ".")) : Number(percent);
  const example =
    mode === "none"
      ? 0
      : computeDeposit(mode, mode === "fixed" ? Math.round(value * 100) : value, 3000);

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save(() => updateDepositAction({ mode, value: mode === "none" ? 0 : value }));
      }}
    >
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-medium">Acompte demandé à la réservation en ligne</legend>
        {MODES.map((m) => (
          <label
            key={m.value}
            className={cn(
              "flex cursor-pointer flex-col rounded-lg border p-3 text-sm transition-colors",
              mode === m.value ? "border-primary bg-primary-soft/50" : "hover:bg-subtle",
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
                className="accent-primary"
              />
              {m.label}
            </span>
            <span className="mt-0.5 pl-5 text-[13px] text-muted-foreground">{m.sub}</span>
          </label>
        ))}
      </fieldset>
      {mode === "fixed" ? (
        <Field id="deposit-fixed" label="Montant (€)" error={errors.value}>
          <Input
            id="deposit-fixed"
            inputMode="decimal"
            value={fixed}
            onChange={(e) => setFixed(e.target.value)}
            className="max-w-40"
          />
        </Field>
      ) : null}
      {mode === "percent" ? (
        <Field id="deposit-percent" label="Pourcentage du prix (%)" error={errors.value}>
          <Input
            id="deposit-percent"
            inputMode="numeric"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="max-w-40"
          />
        </Field>
      ) : null}
      {mode !== "none" ? (
        <div className="rounded-lg bg-subtle p-3 text-[13px] text-muted-foreground">
          <p>
            Exemple pour une prestation à 30 € :{" "}
            <strong className="text-foreground">
              {example ? `${formatCents(example)} payés en ligne` : "pas d'acompte (montant trop faible)"}
            </strong>
            {example ? `, ${formatCents(3000 - example)} sur place.` : "."}
          </p>
          <p className="mt-1">
            Remboursé automatiquement si le client annule dans les délais (
            {cancellationNoticeHours > 0 ? `${cancellationNoticeHours} h avant` : "avant le début"})
            ou si vous annulez. Conservé si le client ne vient pas. Les prestations gratuites ne
            demandent pas d&apos;acompte. Le créneau est bloqué 35 minutes le temps du paiement.
          </p>
        </div>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner /> : null}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
