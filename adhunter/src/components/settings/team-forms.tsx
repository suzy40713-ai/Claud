"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelInvitation, createTeam, inviteMember, removeMember } from "@/lib/actions/teams";

export function CreateTeamForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createTeam(name);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Équipe créée");
          router.refresh();
        });
      }}
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'équipe ou de l'agence" maxLength={60} required aria-label="Nom de l'équipe" />
      <Button type="submit" variant="brand" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Users />} Créer</Button>
    </form>
  );
}

export function InviteForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await inviteMember(teamId, email);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.data.pending ? "Invitation enregistrée : elle sera acceptée à la création de son compte." : "Membre ajouté à l'équipe");
          setEmail("");
          router.refresh();
        });
      }}
    >
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" required aria-label="Email du membre" />
      <Button type="submit" variant="outline" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Inviter</Button>
    </form>
  );
}

export function RemoveMemberButton({ teamId, userId, label }: { teamId: string; userId: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => {
      if (!confirm(`${label} ?`)) return;
      const res = await removeMember(teamId, userId);
      if (!res.ok) return void toast.error(res.error);
      toast.success("C'est fait");
      router.refresh();
    })}>
      <UserMinus /> {label}
    </Button>
  );
}

export function CancelInvitationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => {
      const res = await cancelInvitation(id);
      if (!res.ok) return void toast.error(res.error);
      router.refresh();
    })}>Annuler</Button>
  );
}
