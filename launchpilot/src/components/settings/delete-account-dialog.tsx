"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/actions/account";

export function DeleteAccountDialog() {
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAccount();
    if (result && !result.success) {
      setDeleting(false);
      toast.error(result.error || "Une erreur est survenue.");
    }
    // On success, deleteAccount() redirects server-side.
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Supprimer mon compte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer définitivement ton compte</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Tous tes produits, rapports, contenus et plans seront supprimés
            immédiatement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Tape <span className="font-mono font-semibold text-foreground">SUPPRIMER</span> pour confirmer
          </label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" disabled={confirmText !== "SUPPRIMER" || deleting} onClick={handleDelete}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
