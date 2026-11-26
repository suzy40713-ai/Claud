import { z } from "zod";
import { sendAccessLink } from "@/server/account";
import { env } from "@/server/env";

/** Demande d'un lien d'accès : même réponse que l'adresse existe ou non. */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = z.string().trim().email().max(200).safeParse(form.get("email"));
  if (email.success) await sendAccessLink(email.data);
  return Response.redirect(`${env().APP_URL}/connexion?envoye=1`, 303);
}
