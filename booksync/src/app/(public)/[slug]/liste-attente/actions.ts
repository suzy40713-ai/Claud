"use server";

import { headers } from "next/headers";
import { getOrgBySlug } from "@/server/booking/public";
import { runAction, UserError } from "@/server/errors";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { joinWaitlistPublic, type WaitlistInput } from "@/server/waitlist/service";

export async function joinWaitlistAction(
  slug: string,
  input: WaitlistInput & { website?: string },
) {
  return runAction(async () => {
    // Champ piège invisible : rempli uniquement par les robots.
    if (input.website) throw new UserError("Inscription refusée.");
    const ip = clientIp(await headers());
    if (!rateLimit(`waitlist:${ip}`, 5, 10 * 60_000))
      throw new UserError("Trop d'inscriptions depuis cette connexion. Réessayez plus tard.");
    const org = await getOrgBySlug(slug);
    if (!org) throw new UserError("Établissement introuvable.");
    const { website: _ignored, ...data } = input;
    void _ignored;
    await joinWaitlistPublic(org, data);
  }, "Vous êtes inscrit sur la liste d'attente.");
}
