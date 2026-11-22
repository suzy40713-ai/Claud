import { describe, expect, it } from "vitest";
import { meetingLinkFor, normalizeMeetingUrl } from "@/domain/organization/meeting";

describe("lien de visio", () => {
  it("accepte un lien Meet ou Zoom, ajoute https:// si besoin", () => {
    expect(normalizeMeetingUrl("https://meet.google.com/abc-defg-hij")).toEqual({
      ok: true,
      url: "https://meet.google.com/abc-defg-hij",
    });
    expect(normalizeMeetingUrl(" zoom.us/j/123456 ")).toEqual({
      ok: true,
      url: "https://zoom.us/j/123456",
    });
  });

  it("vide = pas de visio", () => {
    expect(normalizeMeetingUrl("  ")).toEqual({ ok: true, url: null });
  });

  it("refuse http, javascript:, identifiants et texte", () => {
    expect(normalizeMeetingUrl("http://meet.google.com/x").ok).toBe(false);
    expect(normalizeMeetingUrl("javascript:alert(1)").ok).toBe(false);
    expect(normalizeMeetingUrl("https://user:pass@zoom.us/j/1").ok).toBe(false);
    expect(normalizeMeetingUrl("mon lien").ok).toBe(false);
  });

  it("le lien n'est transmis qu'avec un forfait qui l'inclut", () => {
    const org = { meetingUrl: "https://meet.google.com/x" };
    expect(meetingLinkFor(org, { onlineMeetings: false })).toBeNull();
    expect(meetingLinkFor(org, { onlineMeetings: true })).toBe("https://meet.google.com/x");
    expect(meetingLinkFor({ meetingUrl: null }, { onlineMeetings: true })).toBeNull();
  });
});
