"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NICHES } from "@/lib/ads/catalog";
import { createCollection, deleteCollection, removeFromCollection, updateCollection, updateCollectionItemNote } from "@/lib/actions/collections";

const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

export function CollectionDialog({
  mode,
  collection,
  teams = [],
}: {
  mode: "create" | "edit";
  collection?: { id: string; name: string; description: string | null; niche: string | null };
  teams?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name: collection?.name ?? "",
    description: collection?.description ?? "",
    niche: collection?.niche ?? "",
    teamId: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res =
        mode === "create"
          ? await createCollection({ name: form.name, description: form.description, niche: form.niche || null, teamId: form.teamId || null })
          : await updateCollection(collection!.id, { name: form.name, description: form.description, niche: form.niche || null });
      if (!res.ok) return void toast.error(res.error);
      toast.success(mode === "create" ? "Collection créée" : "Collection mise à jour");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? <Button variant="brand"><Plus /> Nouvelle collection</Button> : <Button variant="outline" size="sm"><Pencil /> Modifier</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvelle collection" : "Modifier la collection"}</DialogTitle>
          <DialogDescription>Regroupe des publicités par client, produit, niche ou idée de campagne.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="c-name" className="text-xs font-medium text-muted-foreground">Nom</label>
            <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} placeholder="ex. : Inspirations skincare Q4" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="c-desc" className="text-xs font-medium text-muted-foreground">Description (facultatif)</label>
            <Textarea id="c-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} maxLength={500} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="c-niche" className="text-xs font-medium text-muted-foreground">Niche</label>
            <select id="c-niche" className={selectClass} value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}>
              <option value="">Aucune</option>
              {NICHES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          {mode === "create" && teams.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="c-team" className="text-xs font-medium text-muted-foreground">Partager avec une équipe</label>
              <select id="c-team" className={selectClass} value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
                <option value="">Non, collection privée</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" variant="brand" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCollectionButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer cette collection ? Les publicités restent dans tes favoris.")) return;
        start(async () => {
          const res = await deleteCollection(id);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Collection supprimée");
          router.push("/app/collections");
        });
      }}
    >
      <Trash2 /> Supprimer
    </Button>
  );
}

export function CollectionItemControls({ collectionId, adId, itemId, note }: { collectionId: string; adId: string; itemId: string; note: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(note ?? "");
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => value !== (note ?? "") && start(async () => {
            const res = await updateCollectionItemNote(itemId, value);
            if (res.ok) toast.success("Note enregistrée");
            else toast.error(res.error);
          })}
          placeholder="Ajouter une note…"
          className="h-8 text-xs"
          maxLength={2000}
          aria-label="Note sur cette publicité"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={pending}
          aria-label="Retirer de la collection"
          onClick={() => start(async () => {
            const res = await removeFromCollection(collectionId, adId);
            if (!res.ok) return void toast.error(res.error);
            toast.success("Retirée de la collection");
            router.refresh();
          })}
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
