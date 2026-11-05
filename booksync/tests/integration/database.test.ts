import { afterAll, describe, expect, it } from "vitest";
import { createSql } from "@/db/connection";
import { checkDatabase } from "@/db/health";
import { runMigrations } from "@/db/migrate";
import { TEST_DATABASE_URL, testSql } from "./helpers";

const sql = testSql();
afterAll(() => sql.end());

describe("base de données", () => {
  it("installe les extensions requises dans le schéma `extensions`", async () => {
    const rows = await sql<{ extname: string; schema: string }[]>`
      select e.extname, n.nspname as schema
      from pg_extension e join pg_namespace n on n.oid = e.extnamespace
      where e.extname in ('btree_gist', 'citext')
      order by e.extname`;
    expect(rows).toEqual([
      { extname: "btree_gist", schema: "extensions" },
      { extname: "citext", schema: "extensions" },
    ]);
  });

  it("peut rejouer les migrations sans erreur (idempotence)", async () => {
    await expect(runMigrations(TEST_DATABASE_URL)).resolves.toBeUndefined();
  });

  it("travaille en UTC", async () => {
    const [row] = await sql<{ tz: string }[]>`select current_setting('TimeZone') as tz`;
    expect(row.tz).toBe("UTC");
  });

  it("signale une base saine", async () => {
    const health = await checkDatabase(sql);
    expect(health.ok).toBe(true);
  });

  it("signale une base injoignable sans planter", async () => {
    const broken = createSql("postgres://postgres@127.0.0.1:1/nope", { max: 1 });
    const health = await checkDatabase(broken);
    expect(health.ok).toBe(false);
    await broken.end({ timeout: 1 });
  });

  it("empêche deux réservations qui se chevauchent (fondation anti-double réservation)", async () => {
    await sql.begin(async (tx) => {
      await tx.unsafe(`
        create temporary table demo_booking (
          staff_id uuid not null,
          during tstzrange not null,
          exclude using gist (staff_id with =, during with &&)
        ) on commit drop`);
      const staff = "00000000-0000-0000-0000-000000000001";
      await tx`insert into demo_booking values (${staff}, '[2026-11-10 09:00Z, 2026-11-10 10:00Z)')`;
      // Créneau adjacent : autorisé (bornes semi-ouvertes).
      await tx`insert into demo_booking values (${staff}, '[2026-11-10 10:00Z, 2026-11-10 10:30Z)')`;
      // Chevauchement : refusé par la base elle-même (code 23P01 = exclusion_violation).
      const error = await tx
        .savepoint(
          (sp) =>
            sp`insert into demo_booking values (${staff}, '[2026-11-10 09:30Z, 2026-11-10 09:45Z)')`,
        )
        .catch((e: unknown) => e);
      expect(error).toMatchObject({ code: "23P01" });
    });
  });

  it("active la RLS sur toutes les tables du schéma public (protection de l'API Supabase)", async () => {
    const rows = await sql<{ table: string }[]>`
      select c.relname as table from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`;
    expect(rows.map((r) => r.table)).toEqual([]);
  });
});
