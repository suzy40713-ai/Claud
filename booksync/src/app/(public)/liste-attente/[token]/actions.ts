"use server";

import { headers } from "next/headers";
import { runAction, UserError } from "@/server/errors";
import { dispatchSoon } from "@/server/notifications/dispatch";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { acceptOffer } from "@/server/waitlist/service";

export async function acceptOfferAction(token: string) {
  return runAction(async () => {
    const ip = clientIp(await headers());
    if (!rateLimit(`offer:${ip}`, 20, 10 * 60_000))
      throw new UserError("Trop de tentatives. Réessayez plus tard.");
    const res = await acceptOffer(token);
    dispatchSoon();
    return res;
  });
}
