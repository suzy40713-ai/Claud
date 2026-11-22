import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { testSql } from "./helpers";

// Mode « envoi d'emails non opérationnel » : la confirmation d'email est désactivée.
vi.stubEnv("EMAIL_VERIFICATION", "off");

const sql = testSql();
type Auth = typeof import("@/server/auth/auth").auth;
let auth: Auth;

beforeAll(async () => {
  vi.resetModules();
  auth = (await import("@/server/auth/auth")).auth;
});
afterAll(() => {
  vi.unstubAllEnvs();
  return sql.end();
});

let ip = 1;
function post(path: string, body: unknown) {
  return auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": `10.9.0.${ip++}`,
      },
      body: JSON.stringify(body),
    }),
  );
}

describe("confirmation d'email désactivée (EMAIL_VERIFICATION=off)", () => {
  it("l'inscription connecte directement le compte, sans email de confirmation", async () => {
    const address = `noverif.${Date.now()}@example.com`;
    const res = await post("/sign-up/email", {
      name: "Salon Test",
      email: address,
      password: "MotDePasse2026",
      acceptTerms: true,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string | null };
    expect(body.token).toBeTruthy();
    expect(res.headers.get("set-cookie")).toMatch(/booksync/);

    const emails = await sql`select 1 from email_message where "to" = ${address}`;
    expect(emails).toHaveLength(0);

    const signIn = await post("/sign-in/email", { email: address, password: "MotDePasse2026" });
    expect(signIn.status).toBe(200);
  });
});
