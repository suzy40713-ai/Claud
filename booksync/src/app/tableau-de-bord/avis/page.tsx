import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { RatingBadge, Stars } from "@/components/reviews/stars";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize, formatInTz } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import { listAutomations } from "@/server/autopilot/rules";
import { getRatingSummaries, listOrgReviews } from "@/server/reviews";
import { ReplyButton, VisibilityButton } from "./review-actions";

export const metadata: Metadata = { title: "Avis clients" };

async function Content() {
  const ctx = await requirePermission("reviews.manage");
  const tz = ctx.organization.timezone;
  const [reviews, summaries, automations] = await Promise.all([
    listOrgReviews(ctx),
    getRatingSummaries([ctx.organization.id]),
    listAutomations(ctx),
  ]);
  const summary = summaries.get(ctx.organization.id);
  const request = automations.find((a) => a.key === "review_request");

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          {summary ? (
            <RatingBadge average={summary.average} count={summary.count} className="text-base" />
          ) : (
            <p className="font-medium">Pas encore d&apos;avis publié</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {request?.active
              ? "Demande d'avis automatique activée : vos clients reçoivent un email 2 h après leur rendez-vous."
              : ctx.plan.id === "free"
                ? "La demande d'avis automatique par email est incluse à partir du forfait Starter."
                : "La demande d'avis automatique est désactivée."}
          </p>
        </div>
        <Link
          href="/tableau-de-bord/autopilot"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Réglages des automatisations →
        </Link>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star />}
          title="Aucun avis pour le moment"
          description="Après chaque rendez-vous, vos clients sont invités à noter leur visite. Les avis vérifiés s'affichent sur votre page de réservation et dans l'annuaire."
        />
      ) : (
        <ul className="grid gap-3" data-testid="review-list">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border bg-card p-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <Stars value={r.rating} className="text-base" />
                <Link
                  href={`/tableau-de-bord/clients/${r.customerId}`}
                  className="font-semibold hover:underline"
                >
                  {r.firstName} {r.lastName}
                </Link>
                <span className="text-muted-foreground">
                  · {r.serviceName} du {formatInTz(r.appointmentStartsAt, tz, "d MMM")} · avis du{" "}
                  {capitalize(formatInTz(r.createdAt, tz, "d MMM yyyy"))}
                </span>
                {r.status === "hidden" ? (
                  <Badge variant="neutral">Masqué · {r.hiddenReason}</Badge>
                ) : null}
              </div>
              {r.comment ? (
                <p className="mt-2 text-sm whitespace-pre-line">{r.comment}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground italic">Note sans commentaire</p>
              )}
              {r.reply ? (
                <div className="mt-2 rounded-lg bg-subtle px-3 py-2 text-sm">
                  <p className="text-[13px] font-semibold">Votre réponse</p>
                  <p className="mt-0.5 whitespace-pre-line text-muted-foreground">{r.reply}</p>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <ReplyButton id={r.id} reply={r.reply} />
                <VisibilityButton id={r.id} hidden={r.status === "hidden"} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <>
      <PageHeader
        title="Avis clients"
        description="Avis vérifiés laissés par vos clients après leur rendez-vous. Répondez-y publiquement pour montrer votre sérieux."
      />
      <Suspense fallback={<Skeleton className="h-80" />}>
        <Content />
      </Suspense>
    </>
  );
}
