"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NICHES } from "@/lib/ads/catalog";
import { deleteAccount, restartTutorial, updateProfile } from "@/lib/actions/account";
import { cn } from "@/lib/utils";

export function ProfileForm({ fullName, marketingOptIn, preferredNiches }: { fullName: string; marketingOptIn: boolean; preferredNiches: string[] }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [marketing, setMarketing] = useState(marketingOptIn);
  const [niches, setNiches] = useState(preferredNiches);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateProfile({ fullName: name, marketingOptIn: marketing, preferredNiches: niches });
          if (!res.ok) return void toast.error(res.error);
          toast.success("Profil mis à jour");
          router.refresh();
        });
      }}
    >
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-xs font-medium text-muted-foreground">Nom</label>
        <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="max-w-sm" />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-muted-foreground">Niches préférées (personnalise tes suggestions)</legend>
        <div className="flex flex-wrap gap-1.5">
          {NICHES.map((n) => {
            const on = niches.includes(n.id);
            return (
              <button key={n.id} type="button" aria-pressed={on} onClick={() => setNiches((p) => (on ? p.filter((x) => x !== n.id) : [...p, n.id]))}
                className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-primary bg-primary/20" : "border-border text-muted-foreground hover:text-foreground")}>
                {n.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 accent-[#7657FF]" />
        Recevoir des conseils et nouveautés par email
      </label>
      <Button type="submit" variant="brand" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Enregistrer</Button>
    </form>
  );
}

export function RestartTutorialButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => { await restartTutorial(); router.push("/app"); })}>
      <RotateCcw /> Revoir le tutoriel
    </Button>
  );
}

export function DeleteAccountDialog() {
  const [confirmation, setConfirmation] = useState("");
  const [pending, start] = useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm"><Trash2 /> Supprimer mon compte</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer définitivement ton compte ?</DialogTitle>
          <DialogDescription>
            Toutes tes données (favoris, collections, analyses, créations, historique) seront effacées. Un abonnement en cours sera résilié immédiatement, sans remboursement de la période entamée. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <label htmlFor="confirm-delete" className="text-xs text-muted-foreground">Tape <span className="font-mono text-foreground">SUPPRIMER</span> pour confirmer</label>
          <Input id="confirm-delete" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" />
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={confirmation.trim().toUpperCase() !== "SUPPRIMER" || pending}
            onClick={() => start(async () => {
              const res = await deleteAccount(confirmation);
              if (res && !res.ok) toast.error(res.error);
            })}
          >
            {pending && <Loader2 className="animate-spin" />} Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
