import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Affichage d'une note sur 5 (étoiles pleines, demi-étoile arrondie à l'entier le plus proche). */
export function Stars({ value, className }: { value: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value.toLocaleString("fr-FR")} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-[1em]",
            n <= full ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

/** « 4,8 ★ (12 avis) » */
export function RatingBadge({
  average,
  count,
  className,
}: {
  average: number;
  count: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Stars value={average} className="text-[15px]" />
      <strong className="tabular-nums">{average.toLocaleString("fr-FR")}</strong>
      <span className="text-muted-foreground">({count} avis)</span>
    </span>
  );
}
