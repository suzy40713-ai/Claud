"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cancelSubscription, changePlan, openBillingPortal, resumeSubscription, startCheckout } from "@/lib/actions/billing";
import { formatPrice } from "@/lib/utils";

export function CheckoutButton({ plan, planName, priceCents, disabled, autoOpen }: { plan: "pro" | "business"; planName: string; priceCents: number; disabled?: boolean; autoOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(autoOpen) && !disabled);
  const [waiver, setWaiver] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={plan === "pro" ? "brand" : "outline"} className="w-full" disabled={disabled}>Passer à {planName}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abonnement {planName} — {formatPrice(priceCents)} / mois</DialogTitle>
          <DialogDescription>Paiement sécurisé par Stripe. Sans engagement : résiliable à tout moment depuis cette page.</DialogDescription>
        </DialogHeader>
        <label className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-sm text-muted-foreground">
          <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-1 accent-[#7657FF]" />
          <span>
            Je demande l'accès immédiat au service, avant la fin du délai de rétractation de 14 jours. Si je me rétracte, je reste redevable du montant
            correspondant au service fourni jusque-là (<Link href="/legal/cgv" target="_blank" className="underline">CGV</Link>, art. 4).
          </span>
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            variant="brand"
            disabled={!waiver || pending}
            onClick={() =>
              start(async () => {
                const res = await startCheckout(plan, waiver);
                if (!res.ok) return void toast.error(res.error);
                window.location.href = res.data.url;
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />} Continuer vers le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChangePlanButton({ plan, planName, upgrade }: { plan: "pro" | "business"; planName: string; upgrade: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={upgrade ? "brand" : "outline"}
      className="w-full"
      disabled={pending}
      onClick={() => {
        if (!confirm(`${upgrade ? "Passer" : "Revenir"} à ${planName} ? Le changement est immédiat et la différence est calculée au prorata.`)) return;
        start(async () => {
          const res = await changePlan(plan);
          if (!res.ok) return void toast.error(res.error);
          toast.success(`Tu es maintenant sur la formule ${planName}`);
          router.refresh();
        });
      }}
    >
      {pending && <Loader2 className="animate-spin" />} {upgrade ? `Passer à ${planName}` : `Revenir à ${planName}`}
    </Button>
  );
}

export function CancelOrResume({ canceling, periodEnd }: { canceling: boolean; periodEnd: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (canceling) {
    return (
      <Button
        variant="brand"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await resumeSubscription();
            if (!res.ok) return void toast.error(res.error);
            toast.success("Abonnement réactivé");
            router.refresh();
          })
        }
      >
        {pending && <Loader2 className="animate-spin" />} Réactiver l'abonnement
      </Button>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Résilier l'abonnement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Résilier ton abonnement ?</DialogTitle>
          <DialogDescription>
            Tu gardes l'accès à toutes les fonctionnalités jusqu'au {periodEnd ? new Date(periodEnd).toLocaleDateString("fr-FR") : "terme de la période en cours"}, puis ton compte repasse en formule Free. Tes favoris et collections sont conservés.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await cancelSubscription();
                if (!res.ok) return void toast.error(res.error);
                toast.success("Résiliation enregistrée");
                router.refresh();
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />} Confirmer la résiliation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PortalButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await openBillingPortal();
          if (!res.ok) return void toast.error(res.error);
          window.location.href = res.data.url;
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <ExternalLink />} Moyens de paiement et factures
    </Button>
  );
}
