"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import { replyToReview, setReviewVisibility, type HideReason } from "@/server/reviews";

export async function replyToReviewAction(reviewId: string, reply: string) {
  const ctx = await requireOrg();
  const res = await runAction(
    () => replyToReview(ctx, { reviewId, reply }),
    reply.trim() ? "Réponse publiée." : "Réponse supprimée.",
  );
  revalidatePath("/tableau-de-bord/avis");
  return res;
}

export async function setReviewVisibilityAction(
  reviewId: string,
  visible: boolean,
  reason?: HideReason,
) {
  const ctx = await requireOrg();
  const res = await runAction(
    () =>
      setReviewVisibility(
        ctx,
        visible ? { reviewId, visible: true } : { reviewId, visible: false, reason: reason! },
      ),
    visible ? "Avis republié." : "Avis masqué.",
  );
  revalidatePath("/tableau-de-bord/avis");
  return res;
}
