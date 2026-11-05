import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  existingAccountTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "@/server/email/templates";

describe("modèles d'emails", () => {
  it("échappe le HTML des données utilisateur", () => {
    expect(escapeHtml(`<script>"x"&'y'</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;",
    );
    const email = verifyEmailTemplate({ name: "<b>Pirate</b>", url: "https://booksync.fr/v?t=1" });
    expect(email.html).not.toContain("<b>Pirate</b>");
    expect(email.html).toContain("&lt;b&gt;Pirate&lt;/b&gt;");
  });

  it("confirmation : sujet, prénom, lien en HTML et texte", () => {
    const url = "https://booksync.fr/api/auth/verify-email?token=abc&callbackURL=/x";
    const email = verifyEmailTemplate({ name: "Camille Martin", url });
    expect(email.subject).toBe("Confirmez votre adresse email");
    expect(email.text).toContain("Bienvenue Camille");
    expect(email.text).toContain(url);
    expect(email.html).toContain(escapeHtml(url));
    expect(email.html).toContain('lang="fr"');
  });

  it("réinitialisation et compte existant", () => {
    expect(resetPasswordTemplate({ name: "Léa", url: "https://x/r" }).text).toContain(
      "valable 1 heure",
    );
    const existing = existingAccountTemplate({
      name: "Léa",
      signInUrl: "https://x/c",
      resetUrl: "https://x/m",
    });
    expect(existing.template).toBe("existing-account");
    expect(existing.text).toContain("https://x/c");
  });
});
