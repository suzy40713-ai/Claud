import { connection } from "next/server";
import { sql } from "@/db/client";
import { checkDatabase } from "@/db/health";

/** Sonde de santé utilisée par Render (healthCheckPath) et la supervision. */
export async function GET() {
  await connection();
  const database = await checkDatabase(sql);
  const ok = database.ok;
  return Response.json(
    {
      status: ok ? "ok" : "degraded",
      database: ok ? "ok" : "down",
      latencyMs: database.latencyMs,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
