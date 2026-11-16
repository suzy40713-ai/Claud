import { BadgeCheck } from "lucide-react";
import { capitalize, formatInTz } from "@/lib/format";
import { RatingBadge, Stars } from "./stars";

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: Date;
  serviceName: string;
  author: string;
};

/** Section « Avis clients » de la page publique d'un établissement. */
export function ReviewSection({
  organizationName,
  summary,
  reviews,
  timeZone,
}: {
  organizationName: string;
  summary: { average: number; count: number } | undefined;
  reviews: PublicReview[];
  timeZone: string;
}) {
  if (!summary || !reviews.length) return null;
  return (
    <section
      className="mt-6 rounded-2xl border bg-card p-5 shadow-sm"
      aria-labelledby="avis-titre"
      data-testid="public-reviews"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="avis-titre" className="text-lg font-semibold">
          Avis clients
        </h2>
        <RatingBadge average={summary.average} count={summary.count} />
      </div>
      <ul className="mt-4 grid gap-4">
        {reviews.map((r) => (
          <li key={r.id} className="border-t pt-4 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Stars value={r.rating} className="text-[15px]" />
              <strong>{r.author}</strong>
              <span className="text-muted-foreground">
                · {r.serviceName} · {capitalize(formatInTz(r.createdAt, timeZone, "d MMMM yyyy"))}
              </span>
            </div>
            {r.comment ? (
              <p className="mt-1.5 text-sm whitespace-pre-line">{r.comment}</p>
            ) : null}
            {r.reply ? (
              <div className="mt-2 rounded-lg bg-subtle px-3 py-2 text-sm">
                <p className="text-[13px] font-semibold">Réponse de {organizationName}</p>
                <p className="mt-0.5 whitespace-pre-line text-muted-foreground">{r.reply}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
        <BadgeCheck className="mt-px size-3.5 shrink-0" />
        Avis vérifiés : seuls les clients ayant eu un rendez-vous via BookSync peuvent noter,
        une seule fois par rendez-vous. Aucune contrepartie. Les avis sont publiés sans modération
        préalable et classés du plus récent au plus ancien.
      </p>
    </section>
  );
}
