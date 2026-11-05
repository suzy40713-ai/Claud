"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarClock,
  ChevronRight,
  Mail,
  MoreHorizontal,
  RotateCw,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/domain/permissions";
import { fromNow } from "@/lib/format";
import {
  cancelInvitationAction,
  changeRoleAction,
  inviteAction,
  removeMemberAction,
  resendInvitationAction,
} from "./actions";

type MemberRow = {
  memberId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  staffId: string | null;
  displayName: string | null;
  photoUrl: string | null;
  color: string | null;
  isBookable: boolean | null;
  isSelf: boolean;
  canRemove: boolean;
  roleOptions: Role[];
};

type InvitationRow = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  canManage: boolean;
};

const menuItem =
  "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-accent";

export function TeamView({
  members,
  invitations,
  seats,
  inviteRoles,
  canUpgrade,
}: {
  members: MemberRow[];
  invitations: InvitationRow[];
  seats: { used: number; limit: number; plan: string };
  inviteRoles: Role[];
  canUpgrade: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const full = seats.used >= seats.limit;

  function run<T extends { ok: boolean; error?: string; message?: string }>(fn: () => Promise<T>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message ?? "Modification enregistrée.");
      else toast.error(res.error);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-medium">
            <span data-testid="seat-count" className="tabular-nums">
              {seats.used} / {seats.limit}
            </span>{" "}
            membre{seats.limit > 1 ? "s" : ""} utilisé{seats.used > 1 ? "s" : ""}
          </p>
          <p className="text-[13px] text-muted-foreground">
            Forfait {seats.plan} — vous compris, invitations en attente incluses.
          </p>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className={full ? "h-full bg-warning" : "h-full bg-primary"}
              style={{ width: `${Math.min(100, (seats.used / seats.limit) * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {full && canUpgrade ? (
            <Button asChild variant="secondary">
              <Link href="/tableau-de-bord/abonnement">Changer de forfait</Link>
            </Button>
          ) : null}
          {inviteRoles.length ? <InviteDialog roles={inviteRoles} disabled={full} /> : null}
        </div>
      </div>

      {full && inviteRoles.length ? (
        <Alert variant="info">
          Votre équipe a atteint la limite du forfait {seats.plan}.{" "}
          {canUpgrade
            ? "Passez à un forfait supérieur pour inviter d'autres personnes."
            : "Contactez le propriétaire pour changer de forfait."}
        </Alert>
      ) : null}

      <section
        aria-labelledby="members-title"
        className="overflow-hidden rounded-xl border bg-card"
      >
        <h2 id="members-title" className="border-b px-4 py-3 text-sm font-semibold sm:px-5">
          Membres ({members.length})
        </h2>
        <ul className="divide-y">
          {members.map((m) => (
            <li
              key={m.memberId}
              className="flex items-center gap-3 px-4 py-3 sm:px-5"
              data-testid="member-row"
            >
              <Avatar name={m.displayName ?? m.name} src={m.photoUrl} color={m.color} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium">
                  <span className="truncate">{m.displayName ?? m.name}</span>
                  {m.isSelf ? (
                    <span className="text-xs font-normal text-muted-foreground">(vous)</span>
                  ) : null}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">{m.email}</p>
              </div>
              <Badge
                variant={
                  m.role === "owner" ? "primary" : m.role === "admin" ? "outline" : "neutral"
                }
                className="hidden sm:inline-flex"
              >
                {ROLE_LABELS[m.role]}
              </Badge>
              {m.staffId ? (
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href={`/tableau-de-bord/equipe/${m.staffId}` as Route}>
                    <CalendarClock /> Planning
                  </Link>
                </Button>
              ) : null}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions pour ${m.name}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-50 w-60 rounded-xl border bg-popover p-1.5 shadow-lg"
                  >
                    <div className="px-2.5 py-1.5 text-xs text-muted-foreground sm:hidden">
                      {ROLE_LABELS[m.role]}
                    </div>
                    {m.staffId ? (
                      <DropdownMenu.Item asChild className={menuItem}>
                        <Link href={`/tableau-de-bord/equipe/${m.staffId}` as Route}>
                          <CalendarClock className="size-4" /> Profil, horaires et services
                          <ChevronRight className="ml-auto size-4" />
                        </Link>
                      </DropdownMenu.Item>
                    ) : null}
                    {m.roleOptions.length > 1 ? (
                      <>
                        <DropdownMenu.Separator className="my-1 h-px bg-border" />
                        <DropdownMenu.Label className="px-2.5 py-1 text-xs text-muted-foreground">
                          Rôle
                        </DropdownMenu.Label>
                        {m.roleOptions.map((r) => (
                          <DropdownMenu.Item
                            key={r}
                            className={menuItem}
                            disabled={r === m.role}
                            onSelect={() => run(() => changeRoleAction(m.memberId, r))}
                          >
                            {ROLE_LABELS[r]}
                            {r === m.role ? (
                              <span className="ml-auto text-xs text-muted-foreground">actuel</span>
                            ) : null}
                          </DropdownMenu.Item>
                        ))}
                      </>
                    ) : null}
                    {m.canRemove ? (
                      <>
                        <DropdownMenu.Separator className="my-1 h-px bg-border" />
                        <DropdownMenu.Item
                          className={`${menuItem} text-destructive`}
                          onSelect={() => {
                            if (
                              confirm(
                                `Retirer ${m.name} de l'équipe ? Son accès sera immédiatement supprimé.`,
                              )
                            ) {
                              run(() => removeMemberAction(m.memberId));
                            }
                          }}
                        >
                          <Trash2 className="size-4" /> Retirer de l&apos;équipe
                        </DropdownMenu.Item>
                      </>
                    ) : null}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </li>
          ))}
        </ul>
      </section>

      {invitations.length ? (
        <section aria-labelledby="inv-title" className="overflow-hidden rounded-xl border bg-card">
          <h2 id="inv-title" className="border-b px-4 py-3 text-sm font-semibold sm:px-5">
            Invitations en attente ({invitations.length})
          </h2>
          <ul className="divide-y">
            {invitations.map((i) => {
              const expired = new Date(i.expiresAt) < new Date();
              return (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
                  data-testid="invitation-row"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Mail className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.email}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {ROLE_LABELS[i.role]} ·{" "}
                      {expired ? "expirée" : `expire ${fromNow(i.expiresAt)}`}
                    </p>
                  </div>
                  {i.canManage ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => resendInvitationAction(i.id))}
                      >
                        <RotateCw /> Renvoyer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => cancelInvitationAction(i.id))}
                        aria-label={`Annuler l'invitation de ${i.email}`}
                      >
                        <X /> Annuler
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function InviteDialog({ roles, disabled }: { roles: Role[]; disabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(roles[0]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setError(null);
    startTransition(async () => {
      const res = await inviteAction({ email, role });
      if (!res.ok) {
        setError(res.fieldErrors?.email ?? res.error);
        return;
      }
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <UserPlus /> Inviter
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Inviter un membre"
        description="Un email avec un lien sécurisé, valable 7 jours, lui sera envoyé."
      >
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          {error ? <Alert variant="error">{error}</Alert> : null}
          <Field id="invite-email" label="Adresse email">
            <Input
              id="invite-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="prenom@exemple.fr"
              required
            />
          </Field>
          <Field id="invite-role" label="Rôle" hint={ROLE_DESCRIPTIONS[role]}>
            <NativeSelect
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? <Spinner /> : null}
            Envoyer l&apos;invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
