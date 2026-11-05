import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { exportUserData } from "@/server/account";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });
  const data = await exportUserData(session.user.id);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="booksync-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
