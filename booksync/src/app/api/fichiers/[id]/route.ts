import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { file } from "@/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Images publiques (logos, photos, visuels). Un identifiant ne change jamais de contenu : cache immuable. */
export async function GET(_req: Request, { params }: RouteContext<"/api/fichiers/[id]">) {
  await connection();
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Introuvable", { status: 404 });
  const [row] = await db
    .select({ data: file.data, contentType: file.contentType })
    .from(file)
    .where(eq(file.id, id))
    .limit(1);
  if (!row) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
