/**
 * Applique les migrations SQL versionnées (dossier src/db/migrations).
 * Utilisé en local (`pnpm db:migrate`), dans les tests et au démarrage en production.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import { createSql } from "./connection";

export async function runMigrations(url: string) {
  const sql = createSql(url, { max: 1 });
  try {
    await migrate(drizzle(sql), {
      migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const isCli = process.argv[1]?.endsWith("migrate.ts");
if (isCli) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL est requis pour appliquer les migrations.");
    process.exit(1);
  }
  runMigrations(url)
    .then(() => console.log("✔ Migrations appliquées"))
    .catch((error) => {
      console.error("✖ Échec des migrations :", error);
      process.exit(1);
    });
}
