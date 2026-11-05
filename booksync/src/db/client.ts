import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import { createSql } from "./connection";
import * as schema from "./schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as { __booksyncSql?: ReturnType<typeof createSql> };

// Une seule connexion partagée, réutilisée entre les rechargements à chaud en développement.
const sql =
  globalForDb.__booksyncSql ?? createSql(env.DATABASE_URL, { max: env.DATABASE_POOL_MAX });
if (env.NODE_ENV !== "production") globalForDb.__booksyncSql = sql;

export const db = drizzle(sql, { schema, casing: "snake_case" });
export { sql };
export type Database = typeof db;
