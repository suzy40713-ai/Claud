"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Plus, Search, UsersRound } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatInTz } from "@/lib/format";
import { CustomerForm } from "./customer-form";

type Row = { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; bookings: number; lastVisit: string | null };

export function CustomersView({
  rows,
  total,
  limit,
  planName,
  q,
  page,
  hasMore,
  timeZone,
}: {
  rows: Row[];
  total: number;
  limit: number | null;
  planName: string;
  q: string;
  page: number;
  hasMore: boolean;
  timeZone: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(q);
  const [open, setOpen] = useState(false);
  const full = limit !== null && total >= limit;

  const go = (params: Record<string, string>) => router.push(`${pathname}?${new URLSearchParams(params).toString()}` as Route);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          className="relative flex-1 sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            go(query.trim() ? { q: query.trim() } : {});
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Rechercher un client" placeholder="Nom, email ou téléphone…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </form>
        <p className="text-sm text-muted-foreground sm:ml-auto" data-testid="customer-count">
          {total} client{total > 1 ? "s" : ""}
          {limit !== null ? ` / ${limit} (forfait ${planName})` : ""}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={full}>
              <Plus /> Nouveau client
            </Button>
          </DialogTrigger>
          {open ? (
            <CustomerForm
              id={null}
              onSaved={(id) => {
                toast.success("Client créé.");
                setOpen(false);
                router.push(`/tableau-de-bord/clients/${id}` as Route);
              }}
            />
          ) : null}
        </Dialog>
      </div>
      {full ? (
        <Alert>
          Vous avez atteint la limite de {limit} clients du forfait {planName}.{" "}
          <Link href="/tableau-de-bord/abonnement" className="font-semibold underline">
            Passer au forfait Starter
          </Link>{" "}
          pour des clients illimités.
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title={q ? "Aucun résultat" : "Aucun client pour l'instant"}
          description={q ? "Essayez une autre recherche." : "Vos clients apparaissent ici dès leur première réservation, ou ajoutez-les manuellement."}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="hidden grid-cols-[1fr_1fr_120px_140px_24px] gap-4 border-b bg-subtle px-5 py-2.5 text-[12px] font-medium text-muted-foreground md:grid">
            <span>Client</span>
            <span>Coordonnées</span>
            <span className="text-right">Rendez-vous</span>
            <span>Dernier rendez-vous</span>
            <span />
          </div>
          <ul className="divide-y">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/tableau-de-bord/clients/${c.id}` as Route} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 hover:bg-accent md:grid-cols-[1fr_1fr_120px_140px_24px] md:gap-4 md:px-5" data-testid="customer-row">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={`${c.firstName} ${c.lastName}`} className="size-8 text-[11px]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="block truncate text-[13px] text-muted-foreground md:hidden">{c.email ?? c.phone ?? "—"}</span>
                    </span>
                  </span>
                  <span className="hidden min-w-0 md:block">
                    <span className="block truncate text-sm">{c.email ?? "—"}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{c.phone ?? ""}</span>
                  </span>
                  <span className="hidden text-right text-sm tabular-nums md:block">{c.bookings}</span>
                  <span className="hidden text-sm text-muted-foreground md:block">{c.lastVisit ? formatInTz(c.lastVisit, timeZone, "d MMM yyyy") : "—"}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {page > 1 || hasMore ? (
        <div className="flex justify-between">
          <Button variant="secondary" disabled={page <= 1} onClick={() => go({ ...(q ? { q } : {}), page: String(page - 1) })}>
            Précédent
          </Button>
          <Button variant="secondary" disabled={!hasMore} onClick={() => go({ ...(q ? { q } : {}), page: String(page + 1) })}>
            Suivant
          </Button>
        </div>
      ) : null}
    </div>
  );
}
