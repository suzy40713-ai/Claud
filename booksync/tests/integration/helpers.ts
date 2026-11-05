import { createSql } from "@/db/connection";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5432/booksync_test";

export function testSql() {
  return createSql(TEST_DATABASE_URL, { max: 2 });
}
