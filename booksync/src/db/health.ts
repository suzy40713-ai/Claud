import type { Sql } from "postgres";

export type DatabaseHealth =
  { ok: true; latencyMs: number } | { ok: false; latencyMs: number; error: string };

export async function checkDatabase(sql: Sql): Promise<DatabaseHealth> {
  const start = performance.now();
  try {
    await sql`select 1`;
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
