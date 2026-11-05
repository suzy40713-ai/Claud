import { runMigrations } from "@/db/migrate";
import { TEST_DATABASE_URL, testSql } from "./helpers";

/** Repart d'une base de test vierge puis applique toutes les migrations. */
export default async function setup() {
  if (!/localhost|127\.0\.0\.1|_test/.test(TEST_DATABASE_URL)) {
    throw new Error("Refus de réinitialiser une base qui ne ressemble pas à une base de test.");
  }
  const sql = testSql();
  await sql.unsafe(`
    DROP SCHEMA IF EXISTS public CASCADE;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    DROP SCHEMA IF EXISTS extensions CASCADE;
    CREATE SCHEMA public;
  `);
  await sql.end();
  await runMigrations(TEST_DATABASE_URL);
}
