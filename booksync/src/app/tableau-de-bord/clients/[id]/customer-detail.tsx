"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { STATUS_LABELS } from "@/components/appointments/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatCents, formatInTz } from "@/lib/format";
import { CustomerForm, type CustomerValues } from "../customer-form";
import { deleteCustomerAction } from "../actions";

const variant = { confirmed: "primary", cancelled: "destructive", completed: "success", no_show: "warning" } as const;

export function CustomerDetail({
  timeZone,
  customer,
  history,
  stats,
}: {
  timeZone: string;
  customer: CustomerValues & { id: string; createdAt: string };
  history: { id: string; startsAt: string; status: keyof typeof STATUS_LABELS; serviceName: string; priceCents: number; staffName: string }[];
  stats: { total: number; completed: number; noShow: number; cancelled: number; revenueCents: number };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const name = `${customer.firstName} ${customer.lastName}`;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={name} className="size-14 text-lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="text-sm text-muted-foreground">Client depuis le {formatInTz(customer.createdAt, timeZone, "d MMMM yyyy")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {customer.phone ? (
            <Button asChild variant="secondary" size="sm">
              <a href={`tel:${customer.phone.replace(/\s/g, "")}`}>
                <Phone /> Appeler
              </a>
            </Button>
          ) : null}
          {customer.email ? (
            <Button asChild variant="secondary" size="sm">
              <a href={`mailto:${customer.email}`}>
                <Mail /> Écrire
              </a>
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil /> Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Supprimer définitivement la fiche de ${name} et son historique de rendez-vous ?`)) return;
              startTransition(async () => {
                const res = await deleteCustomerAction(customer.id);
                if (!res.ok) return void toast.error(res.error);
                toast.success(res.message);
                router.replace("/tableau-de-bord/clients");
              });
            }}
          >
            <Trash2 /> Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Rendez-vous", String(stats.total)],
          ["Honorés", String(stats.completed)],
          ["Absences", String(stats.noShow)],
          ["Chiffre d'affaires", formatCents(stats.revenueCents)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-card p-4">
            <p className="text-[13px] text-muted-foreground">{k}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-xl border bg-card">
          <h2 className="border-b px-4 py-3 text-sm font-semibold sm:px-5">Historique des rendez-vous</h2>
          {history.length ? (
            <ul className="divide-y">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{h.serviceName}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {formatInTz(h.startsAt, timeZone, "EEE d MMM yyyy, HH:mm")} · {h.staffName}
                    </p>
                  </div>
                  <span className="hidden text-sm tabular-nums sm:block">{h.priceCents ? formatCents(h.priceCents) : ""}</span>
                  <Badge variant={variant[h.status]}>{STATUS_LABELS[h.status]}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Aucun rendez-vous.</p>
          )}
        </section>
        <aside className="grid h-fit gap-4">
          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold">Coordonnées</h2>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-[13px] text-muted-foreground">Email</dt>
                <dd className="break-all">{customer.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted-foreground">Téléphone</dt>
                <dd>{customer.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted-foreground">Emails de rendez-vous</dt>
                <dd>{customer.emailOptIn ? "Acceptés" : "Refusés"}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="mb-2 text-sm font-semibold">Notes internes</h2>
            <p className="text-sm whitespace-pre-line text-muted-foreground">{customer.notes || "Aucune note."}</p>
          </section>
        </aside>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        {editing ? (
          <CustomerForm
            id={customer.id}
            initial={customer}
            onSaved={() => {
              toast.success("Client modifié.");
              setEditing(false);
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
