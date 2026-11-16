"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "./actions";

const LABELS = ["", "Décevant", "Moyen", "Bien", "Très bien", "Excellent"];

export function ReviewForm({ token, initialRating }: { token: string; initialRating: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shown = hover || rating;

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) {
          setError("Choisissez une note de 1 à 5 étoiles.");
          return;
        }
        startTransition(async () => {
          const res = await submitReviewAction(token, { rating, comment });
          if (res.ok) {
            toast.success(res.message);
            router.refresh();
          } else {
            setError(res.fieldErrors?.comment ?? res.error);
          }
        });
      }}
    >
      <fieldset className="grid justify-items-center gap-2">
        <legend className="mb-2 w-full text-center text-sm font-medium">Votre note</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} étoile${n > 1 ? "s" : ""} sur 5`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)}
              onClick={() => {
                setRating(n);
                setError(null);
              }}
              className="rounded-md p-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <Star
                className={cn(
                  "size-10 transition-colors",
                  n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
        <p className="h-5 text-sm font-medium text-muted-foreground" aria-live="polite">
          {LABELS[shown]}
        </p>
      </fieldset>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">
          Votre commentaire <span className="font-normal text-muted-foreground">(facultatif)</span>
        </span>
        <Textarea
          name="comment"
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Accueil, qualité de la prestation, ponctualité…"
        />
      </label>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner /> : null}
        Publier mon avis
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Votre avis sera publié avec votre prénom et l&apos;initiale de votre nom. L&apos;établissement
        peut y répondre publiquement.
      </p>
    </form>
  );
}
