"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { useSave } from "@/components/settings/use-save";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { euros, giftCardState } from "@/domain/billing/gift-card";
import { lookupGiftCardAction, updateGiftSettingsAction, spendGiftCardAction } from "./actions";

export function GiftSettingsForm({
  initial,
}: {
  initial: { enabled: boolean; amounts: number[] };
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [amounts, setAmounts] = useState(initial.amounts.map((a) => a / 100).join(", "));
  const { pending, errors, save } = useSave();
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save(() => updateGiftSettingsAction({ enabled, amounts }));
      }}
    >
      <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <span>
          <span className="block text-sm font-medium">Vendre des cartes cadeaux en ligne</span>
          <span className="block text-xs text-muted-foreground">
            Un bouton « Offrir une carte cadeau » apparaît sur votre page de réservation.
          </span>
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label="Vendre des cartes cadeaux en ligne"
        />
      </label>
      <Field
        id="amounts"
        label="Montants proposés (en euros)"
        hint="Séparés par des virgules, de 10 € à 500 €. Exemple : 30, 50, 100"
        error={errors.amounts}
      >
        <Input id="amounts" value={amounts} onChange={(e) => setAmounts(e.target.value)} />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner /> : null} Enregistrer
        </Button>
      </div>
    </form>
  );
}

type Found = {
  code: string;
  status: "pending" | "active";
  amountCents: number;
  balanceCents: number;
  recipientName: string;
  expiresAt: string | null;
  uses: Array<{ amountCents: number; at: string; by: string | null }>;
};

const STATE_LABEL = {
  active: { label: "Utilisable", variant: "success" },
  used: { label: "Entièrement utilisée", variant: "neutral" },
  expired: { label: "Expirée", variant: "warning" },
  pending: { label: "Non payée", variant: "warning" },
} as const;

/** Comptoir : retrouver une carte par son code et déduire le montant de la prestation. */
export function RedeemPanel({ timeZone }: { timeZone: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [pending, startTransition] = useTransition();

  function lookup(c = code) {
    startTransition(async () => {
      const res = await lookupGiftCardAction(c);
      if (res.ok) setFound(res.data);
      else {
        setFound(null);
        toast.error(res.error);
      }
    });
  }

  const state = found
    ? giftCardState({
        status: found.status,
        balanceCents: found.balanceCents,
        expiresAt: found.expiresAt ? new Date(found.expiresAt) : null,
      })
    : null;

  return (
    <div className="grid gap-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          lookup();
        }}
      >
        <Input
          aria-label="Code de la carte cadeau"
          placeholder="Code, ex. ABCD-EFGH"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          className="font-mono uppercase"
        />
        <Button type="submit" disabled={pending || !code.trim()}>
          {pending ? <Spinner /> : <Search />} Vérifier
        </Button>
      </form>

      {found && state ? (
        <div className="rounded-xl border bg-subtle p-4" data-testid="gift-found">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold">{found.code}</span>
            <Badge variant={STATE_LABEL[state].variant}>{STATE_LABEL[state].label}</Badge>
            <span className="text-sm text-muted-foreground">pour {found.recipientName}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold" data-testid="gift-balance">
            {euros(found.balanceCents)}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              restants sur {euros(found.amountCents)}
            </span>
          </p>
          {state === "active" ? (
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const res = await spendGiftCardAction(found.code, amount);
                  if (res.ok) {
                    toast.success(
                      `Montant déduit. Solde restant : ${euros(res.data.balanceCents)}.`,
                    );
                    setAmount("");
                    lookup(found.code);
                    router.refresh();
                  } else toast.error(res.error);
                });
              }}
            >
              <Field id="redeem-amount" label="Montant de la prestation à déduire (€)">
                <Input
                  id="redeem-amount"
                  inputMode="decimal"
                  placeholder="25"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-36"
                />
              </Field>
              <Button type="submit" disabled={pending || !amount.trim()}>
                <CheckCircle2 /> Déduire
              </Button>
            </form>
          ) : null}
          {found.uses.length ? (
            <ul className="mt-4 grid gap-1 text-sm text-muted-foreground">
              {found.uses.map((u) => (
                <li key={u.at}>
                  −{euros(u.amountCents)} le{" "}
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone,
                  }).format(new Date(u.at))}
                  {u.by ? ` par ${u.by}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
