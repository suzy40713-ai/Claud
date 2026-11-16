"use server";

import { headers } from "next/headers";
import { runAction, UserError } from "@/server/errors";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { submitReview } from "@/server/reviews";

export async function submitReviewAction(
  token: string,
  input: { rating: number; comment: string },
) {
  return runAction(async () => {
    const ip = clientIp(await headers());
    if (!rateLimit(`review:${ip}`, 10, 10 * 60_000))
      throw new UserError("Trop de tentatives. Réessayez plus tard.");
    await submitReview(token, input);
  }, "Merci pour votre avis !");
}
