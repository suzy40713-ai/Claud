"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, MessageSquareReply } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { HideReason } from "@/server/reviews";
import { replyToReviewAction, setReviewVisibilityAction } from "./actions";

export function ReplyButton({ id, reply }: { id: string; reply: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(reply ?? "");
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <MessageSquareReply /> {reply ? "Modifier la réponse" : "Répondre"}
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Répondre à l'avis"
        description="Votre réponse est publique : elle s'affiche sous l'avis, sur votre page de réservation."
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await replyToReviewAction(id, text);
              if (res.ok) {
                toast.success(res.message);
                setOpen(false);
                router.refresh();
              } else toast.error(res.fieldErrors?.reply ?? res.error);
            });
          }}
        >
          <Textarea
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder="Merci pour votre visite…"
            aria-label="Votre réponse"
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {reply ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setText("")}
              >
                Effacer
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : null}
              Publier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const REASONS: Record<HideReason, string> = {
  insulting: "Propos injurieux ou diffamatoires",
  personal_data: "Données personnelles",
  off_topic: "Sans rapport avec la prestation",
  spam: "Publicité ou spam",
};

export function VisibilityButton({ id, hidden }: { id: string; hidden: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<HideReason | "">("");
  const [pending, startTransition] = useTransition();
  const run = (visible: boolean) =>
    startTransition(async () => {
      const res = await setReviewVisibilityAction(id, visible, reason || undefined);
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        router.refresh();
      } else toast.error(res.error);
    });

  if (hidden)
    return (
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(true)}>
        {pending ? <Spinner /> : <Eye />} Republier
      </Button>
    );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <EyeOff /> Masquer
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Masquer cet avis"
        description="Un avis ne peut être masqué que pour un motif légitime. Un avis négatif mais respectueux doit rester visible : vous pouvez y répondre."
      >
        <div className="grid gap-4">
          <NativeSelect
            value={reason}
            onChange={(e) => setReason(e.target.value as HideReason)}
            aria-label="Motif"
          >
            <option value="">Choisissez un motif…</option>
            {Object.entries(REASONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
          <Button disabled={pending || !reason} onClick={() => run(false)}>
            {pending ? <Spinner /> : null}
            Masquer l&apos;avis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
