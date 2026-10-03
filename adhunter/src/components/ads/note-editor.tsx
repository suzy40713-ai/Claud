"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateFavorite } from "@/lib/actions/ads";

export function NoteEditor({ adId, initialNote }: { adId: string; initialNote: string | null }) {
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, start] = useTransition();
  const dirty = note !== (initialNote ?? "");
  return (
    <div className="space-y-2">
      <label htmlFor={`note-${adId}`} className="text-xs font-medium text-muted-foreground">Note personnelle</label>
      <Textarea id={`note-${adId}`} value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} placeholder="Ce que tu retiens de cette publicité, une idée à tester…" />
      <Button
        size="sm"
        variant="outline"
        disabled={!dirty || pending}
        onClick={() =>
          start(async () => {
            const res = await updateFavorite({ adId, note });
            if (res.ok) toast.success("Note enregistrée");
            else toast.error(res.error);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Enregistrer la note
      </Button>
    </div>
  );
}
