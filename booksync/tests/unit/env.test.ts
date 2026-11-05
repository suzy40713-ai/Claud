import { afterEach, describe, expect, it, vi } from "vitest";

const VALID = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  BETTER_AUTH_SECRET: "x".repeat(32),
};

async function loadEnv(vars: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries({ ...VALID, ...vars })) vi.stubEnv(k, v as string);
  return (await import("@/lib/env")).env;
}

afterEach(() => vi.unstubAllEnvs());

describe("validation des variables d'environnement", () => {
  it("accepte une configuration valide et applique les valeurs par défaut", async () => {
    const env = await loadEnv({
      DATABASE_URL: "postgres://u:p@localhost:5432/db",
      DATABASE_POOL_MAX: undefined,
    });
    expect(env.DATABASE_URL).toBe("postgres://u:p@localhost:5432/db");
    expect(env.DATABASE_POOL_MAX).toBe(10);
    expect(env.EMAIL_FROM).toBe("BookSync <onboarding@resend.dev>");
  });

  it("refuse un secret d'authentification trop court", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv({ BETTER_AUTH_SECRET: "court" })).rejects.toThrow();
  });

  it("refuse une clé Resend mal formée", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv({ RESEND_API_KEY: "sk_live_xxx" })).rejects.toThrow();
  });

  it("refuse une DATABASE_URL qui n'est pas PostgreSQL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv({ DATABASE_URL: "mysql://localhost/db" })).rejects.toThrow();
  });

  it("refuse l'absence de DATABASE_URL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv({ DATABASE_URL: "" })).rejects.toThrow();
  });
});
