import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/server/account";
import { env } from "@/server/env";

export async function POST() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.redirect(`${env().APP_URL}/`, 303);
}
