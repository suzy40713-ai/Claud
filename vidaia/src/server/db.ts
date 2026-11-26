import "server-only";
import postgres from "postgres";
import { env } from "./env";

let client: ReturnType<typeof postgres> | null = null;

export function sql() {
  client ??= postgres(env().DATABASE_URL, { max: 5, idle_timeout: 20, prepare: false });
  return client;
}
