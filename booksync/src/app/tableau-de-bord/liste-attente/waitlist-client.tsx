"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { addWaitlistEntryAction, cancelWaitlistEntryAction } from "./actions";

export function AddEntryButton(props: {
  services: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; name: string }>;
  today: string;
  maxDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Inscrire un client
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Inscrire sur la liste d'attente"
        description="Le client sera prévenu par email dès qu'un créneau compatible se libère."
      >
        <WaitlistForm
          {...props}
          submitLabel="Inscrire"
          onSubmit={(values) => addWaitlistEntryAction(values)}
          onDone={(message) => {
            toast.success(message ?? "Client inscrit.");
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function CancelEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (!confirm("Retirer ce client de la liste d'attente ?")) return;
          const res = await cancelWaitlistEntryAction(id);
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
          router.refresh();
        })
      }
    >
      Retirer
    </Button>
  );
}
