import { accountFromLink, startSession } from "@/server/account";
import { env } from "@/server/env";

/** Lien d'accès reçu par email : ouvre la session. */
export async function GET(req: Request) {
  const id = accountFromLink(new URL(req.url).searchParams.get("t"));
  const app = env().APP_URL;
  if (!id) return Response.redirect(`${app}/connexion?lien=expire`, 303);
  await startSession(id);
  return Response.redirect(`${app}/studio`, 303);
}
