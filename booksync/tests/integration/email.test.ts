import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { verifyEmailTemplate } from "@/server/email/templates";
import { testSql } from "./helpers";

const sql = testSql();
afterAll(() => sql.end());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function loadSender(resendKey?: string) {
  vi.resetModules();
  vi.stubEnv("RESEND_API_KEY", resendKey ?? "");
  return (await import("@/server/email/send")).sendEmail;
}

const template = verifyEmailTemplate({ name: "Camille", url: "https://booksync.fr/v" });
const to = () => `mail.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@example.com`;

describe("envoi d'emails (outbox)", () => {
  it("sans fournisseur : l'email est journalisé, rien n'est envoyé", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const sendEmail = await loadSender();
    const address = to();
    const result = await sendEmail(address, template);
    expect(result.status).toBe("logged");
    expect(fetchSpy).not.toHaveBeenCalled();
    const [row] = await sql`select status, subject from email_message where id = ${result.id}`;
    expect(row).toMatchObject({ status: "logged", subject: "Confirmez votre adresse email" });
  });

  it("avec Resend : appel API correct et statut « sent »", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: "re_msg_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const sendEmail = await loadSender("re_test_key");
    const address = to();
    const result = await sendEmail(address, template);
    expect(result.status).toBe("sent");
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(init.body)).toMatchObject({ to: address, subject: template.subject });
    const [row] =
      await sql`select status, provider_message_id, sent_at from email_message where id = ${result.id}`;
    expect(row.status).toBe("sent");
    expect(row.provider_message_id).toBe("re_msg_123");
    expect(row.sent_at).toBeInstanceOf(Date);
  });

  it("échec du fournisseur : statut « failed », erreur conservée, aucune exception", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: "Domaine non vérifié" }), { status: 403 }),
        ),
    );
    const sendEmail = await loadSender("re_test_key");
    const result = await sendEmail(to(), template);
    expect(result.status).toBe("failed");
    const [row] = await sql`select status, error from email_message where id = ${result.id}`;
    expect(row).toMatchObject({ status: "failed", error: "Domaine non vérifié" });
  });
});
