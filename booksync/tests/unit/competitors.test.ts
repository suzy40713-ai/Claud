import { describe, expect, it } from "vitest";
import { extractPage, isPublicIp } from "@/domain/marketing/page-extract";
import { parseCompetitorUrls } from "@/domain/marketing/tools/competitors";
import { competitorsTemplate } from "@/domain/marketing/templates/competitors";
import { competitorsSchema } from "@/domain/marketing/tools/competitors";

const HTML = `<html><head><title>Bougies Nova &amp; Co</title>
<meta name="description" content="Bougies naturelles coulées en France.">
<script>var x = "29 €";</script></head><body><nav>Menu 99 €</nav>
<h1>Nos bougies</h1><h2>Coffret découverte</h2><p>Bougie classique 24,90 € — Coffret 49 €</p></body></html>`;

describe("concurrence", () => {
  it("lit titre, description, titres et prix réellement présents", () => {
    const p = extractPage(HTML, "https://nova.fr");
    expect(p).toMatchObject({
      title: "Bougies Nova & Co",
      description: "Bougies naturelles coulées en France.",
      headings: ["Nos bougies", "Coffret découverte"],
      prices: ["24,90 €", "49 €"],
    });
    expect(p.text).not.toContain("var x");
  });

  it("refuse les adresses internes", () => {
    for (const ip of ["127.0.0.1", "10.0.0.2", "192.168.1.1", "172.20.0.1", "169.254.169.254", "::1", "fd00::1", "::ffff:127.0.0.1", "0.0.0.0"])
      expect(isPublicIp(ip)).toBe(false);
    for (const ip of ["93.184.216.34", "2606:4700::1111"]) expect(isPublicIp(ip)).toBe(true);
  });

  it("3 adresses maximum, http(s) uniquement", () => {
    expect(parseCompetitorUrls("nova.fr\nftp://x.fr\nhttps://a.fr, https://b.fr https://c.fr")).toEqual([
      "https://nova.fr/",
      "https://a.fr/",
      "https://b.fr/",
    ]);
    expect(parseCompetitorUrls("javascript:alert(1)\nlocalhost")).toEqual([]);
  });

  it("modèle sans IA : rien d'inventé, page illisible signalée", () => {
    const out = competitorsTemplate(
      { name: "Lumi", description: "Bougies faites main.", priceCents: 2490, category: "physique", benefits: null, targetAudience: null, url: null },
      [
        { url: "https://nova.fr", page: extractPage(HTML, "https://nova.fr") },
        { url: "https://ferme.fr", page: null },
      ],
      "",
    );
    expect(competitorsSchema.safeParse(out).success).toBe(true);
    expect(out.competitors[0].prices).toEqual(["24,90 €", "49 €"]);
    expect(out.competitors[1]).toMatchObject({ basis: "hypothese", prices: [] });
  });
});
