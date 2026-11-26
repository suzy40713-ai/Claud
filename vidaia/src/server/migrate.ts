/** Crée les tables VidaIA si besoin (idempotent). Lancé au démarrage du serveur. */
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[vidaia] DATABASE_URL manquante : migration ignorée");
  process.exit(0);
}
async function main(databaseUrl: string) {
  const db = postgres(databaseUrl, { max: 1, prepare: false, onnotice: () => {} });
  const file = path.join(process.cwd(), "src/server/schema.sql");
  await db.unsafe(readFileSync(file, "utf8"));
  await db.end();
  console.info("[vidaia] tables prêtes");
}

main(url).catch((error) => {
  console.error("[vidaia] migration impossible", error);
  process.exit(1);
});
