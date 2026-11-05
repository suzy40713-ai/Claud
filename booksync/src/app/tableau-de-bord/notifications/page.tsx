import type { Metadata } from "next";
import { Suspense } from "react";
import { Bell, CalendarPlus, CalendarX2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInTz, fromNow } from "@/lib/format";
import { requireOrg } from "@/server/auth/session";
import { listCustomerDeliveries, listMyNotifications } from "@/server/notifications/feed";
import { MarkAllRead } from "./mark-all-read";

export const metadata: Metadata = { title: "Notifications" };

const FEED = {
  staff_new_booking: { icon: CalendarPlus, label: "Nouvelle réservation" },
  staff_booking_rescheduled: { icon: RefreshCw, label: "Rendez-vous déplacé" },
  staff_booking_cancelled: { icon: CalendarX2, label: "Rendez-vous annulé" },
} as const;

const DELIVERY_LABELS: Record<string, string> = {
  booking_confirmation: "Confirmation",
  booking_rescheduled: "Modification",
  booking_cancelled: "Annulation",
  reminder_24h: "Rappel 24 h",
  reminder_2h: "Rappel 2 h",
};
const STATUS: Record<string, { label: string; variant: "success" | "primary" | "destructive" | "neutral" | "warning" }> = {
  sent: { label: "Envoyé", variant: "success" },
  pending: { label: "Programmé", variant: "primary" },
  processing: { label: "En cours", variant: "primary" },
  failed: { label: "Échec", variant: "destructive" },
  skipped: { label: "Non envoyé", variant: "neutral" },
  cancelled: { label: "Annulé", variant: "neutral" },
};

async function Content() {
  const ctx = await requireOrg();
  const tz = ctx.organization.timezone;
  const [feed, deliveries] = await Promise.all([listMyNotifications(ctx), listCustomerDeliveries(ctx)]);
  const unread = feed.filter((f) => !f.readAt).length;
  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Activité {unread ? <Badge variant="primary" className="ml-1">{unread} non lue{unread > 1 ? "s" : ""}</Badge> : null}</h2>
          {unread ? <MarkAllRead /> : null}
        </div>
        {feed.length === 0 ? (
          <EmptyState icon={<Bell />} title="Aucune notification" description="Vous serez prévenu ici à chaque nouvelle réservation, modification ou annulation." />
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {feed.map((n) => {
              const meta = FEED[n.type as keyof typeof FEED] ?? { icon: Bell, label: "Notification" };
              const Icon = meta.icon;
              return (
                <li key={n.id} className="flex gap-3 px-4 py-3 sm:px-5" data-testid="notification-row">
                  <span className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full ${n.readAt ? "bg-muted text-muted-foreground" : "bg-primary-soft text-primary-soft-foreground"}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{meta.label}</span>
                      {n.firstName ? ` — ${n.firstName} ${n.lastName}` : ""}
                    </p>
                    {n.startsAt ? (
                      <p className="text-[13px] text-muted-foreground">
                        {n.serviceName} · {formatInTz(n.startsAt, tz, "EEE d MMM 'à' HH:mm")}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{fromNow(n.createdAt)}</span>
                  {!n.readAt ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Non lue" /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {deliveries.length || ctx.role !== "employee" ? (
        <section className="grid gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Emails envoyés à vos clients</h2>
            <p className="text-sm text-muted-foreground">Confirmations et rappels, avec leur statut d&apos;envoi. Les échecs sont retentés automatiquement.</p>
          </div>
          {deliveries.length ? (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-subtle text-left text-[12px] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Destinataire</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deliveries.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2.5">{DELIVERY_LABELS[d.type] ?? d.type}</td>
                      <td className="max-w-48 truncate px-4 py-2.5">{d.recipient}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{formatInTz(d.sentAt ?? d.scheduledFor, tz, "d MMM HH:mm")}</td>
                      <td className="px-4 py-2.5" title={d.lastError ?? undefined}>
                        <Badge variant={STATUS[d.status]?.variant ?? "neutral"}>{STATUS[d.status]?.label ?? d.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              {ctx.plan.features.emailNotifications ? "Aucun email envoyé pour l'instant." : "Les emails aux clients sont inclus à partir du forfait Starter."}
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="Ce qui s'est passé récemment dans votre agenda." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content />
      </Suspense>
    </>
  );
}
