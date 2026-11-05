import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql } from "./helpers";

const sql = testSql();
type Auth = typeof import("@/server/auth/auth").auth;
let auth: Auth;

beforeAll(async () => {
  auth = (await import("@/server/auth/auth")).auth;
});
afterAll(() => sql.end());

const BASE = "http://localhost:3000/api/auth";
let ipCounter = 1;
function post(path: string, body: unknown, ip = `10.0.0.${ipCounter++}`) {
  return auth.handler(
    new Request(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(body),
    }),
  );
}
const email = (p: string) =>
  `${p}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@example.com`;

describe("authentification (API réelle + base PostgreSQL)", () => {
  it("inscription : crée l'utilisateur non vérifié, hache le mot de passe et journalise l'email", async () => {
    const address = email("signup");
    const res = await post("/sign-up/email", {
      name: "Camille",
      email: address,
      password: "MotDePasse2026",
    });
    expect(res.status).toBe(200);

    const [user] = await sql<{ id: string; email_verified: boolean }[]>`
      select id, email_verified from "user" where email = ${address}`;
    expect(user.email_verified).toBe(false);

    const [account] = await sql<{ password: string }[]>`
      select password from account where user_id = ${user.id} and provider_id = 'credential'`;
    expect(account.password).not.toContain("MotDePasse2026");
    expect(account.password.length).toBeGreaterThan(40);

    const emails = await sql<{ template: string; status: string; text: string }[]>`
      select template, status, text from email_message where "to" = ${address}`;
    expect(emails).toHaveLength(1);
    expect(emails[0]).toMatchObject({ template: "verify-email", status: "logged" });
    expect(emails[0].text).toMatch(/http:\/\/localhost:3000\/api\/auth\/verify-email\?token=/);
  });

  it("refuse un mot de passe trop court côté serveur (même si le client est contourné)", async () => {
    const res = await post("/sign-up/email", { name: "X", email: email("short"), password: "abc" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "PASSWORD_TOO_SHORT" });
  });

  it("refuse la connexion tant que l'email n'est pas confirmé", async () => {
    const address = email("unverified");
    await post("/sign-up/email", { name: "Léa", email: address, password: "MotDePasse2026" });
    const res = await post("/sign-in/email", { email: address, password: "MotDePasse2026" });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
    expect(res.headers.get("set-cookie") ?? "").not.toContain("session_token");
  });

  it("limite les tentatives de connexion (5 par minute et par IP)", async () => {
    const ip = "203.0.113.42";
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await post(
        "/sign-in/email",
        { email: "personne@example.com", password: "Mauvais12345" },
        ip,
      );
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it("chaque table du schéma public a la RLS activée", async () => {
    const rows = await sql<{ table: string }[]>`
      select c.relname as table from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`;
    expect(rows).toEqual([]);
    const [count] = await sql<{ n: number }[]>`
      select count(*)::int as n from pg_tables where schemaname = 'public'`;
    expect(count.n).toBeGreaterThanOrEqual(9);
  });
});
