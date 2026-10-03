"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, FolderPlus, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toggleFavorite } from "@/lib/actions/ads";
import { addToCollection, createCollection } from "@/lib/actions/collections";
import { cn } from "@/lib/utils";

export interface CollectionOption {
  id: string;
  name: string;
}

export function FavoriteButton({ adId, initialSaved, compact }: { adId: string; initialSaved: boolean; compact?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size={compact ? "icon" : "sm"}
      variant={saved ? "secondary" : "outline"}
      className={cn(compact && "h-8 w-8")}
      aria-pressed={saved}
      aria-label={saved ? "Retirer des favoris" : "Enregistrer dans les favoris"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleFavorite(adId);
          if (!res.ok) return void toast.error(res.error);
          setSaved(res.data.saved);
          toast.success(res.data.saved ? "Publicité enregistrée dans tes favoris" : "Retirée des favoris");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : saved ? <BookmarkCheck className="text-violet-400" /> : <Bookmark />}
      {!compact && (saved ? "Enregistrée" : "Enregistrer")}
    </Button>
  );
}

export function AddToCollection({ adId, collections, compact }: { adId: string; collections: CollectionOption[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [list, setList] = useState(collections);
  const [pending, start] = useTransition();

  function add(collectionId: string, label: string) {
    start(async () => {
      const res = await addToCollection(collectionId, adId);
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Ajoutée à « ${label} »`);
      setOpen(false);
    });
  }

  function createAndAdd() {
    if (!name.trim()) return;
    start(async () => {
      const res = await createCollection({ name });
      if (!res.ok) return void toast.error(res.error, res.code === "plan_required" ? { action: { label: "Voir les offres", onClick: () => (window.location.href = "/app/billing") } } : undefined);
      setList((l) => [...l, { id: res.data.id, name }]);
      setName("");
      const added = await addToCollection(res.data.id, adId);
      if (!added.ok) return void toast.error(added.error);
      toast.success(`Collection « ${name} » créée`);
      setOpen(false);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size={compact ? "icon" : "sm"} variant="outline" className={cn(compact && "h-8 w-8")} aria-label="Ajouter à une collection">
          <FolderPlus />
          {!compact && "Collection"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Ajouter à une collection</p>
        <div className="max-h-48 overflow-y-auto">
          {list.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">Aucune collection pour l'instant.</p>}
          {list.map((c) => (
            <button key={c.id} disabled={pending} onClick={() => add(c.id, c.name)} className="w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary disabled:opacity-50">
              {c.name}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle collection" className="h-8 text-xs" maxLength={80} onKeyDown={(e) => e.key === "Enter" && createAndAdd()} />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={createAndAdd} disabled={pending || !name.trim()} aria-label="Créer la collection">
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          </Button>
        </div>
        <Link href="/app/collections" className="mt-1 block px-2 py-1 text-xs text-muted-foreground hover:text-foreground">Gérer mes collections →</Link>
      </PopoverContent>
    </Popover>
  );
}
