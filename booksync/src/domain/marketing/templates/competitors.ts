import type { PageSummary } from "../page-extract";
import type { CompetitorsOutput } from "../tools/competitors";
import { benefitList, lowerFirst, noun, type ProductInfo } from "./common";

/** Analyse de concurrence sans IA : uniquement ce qui figure dans les pages lues et les notes. */
export function competitorsTemplate(
  p: ProductInfo,
  pages: Array<{ url: string; page: PageSummary | null }>,
  notes: string,
): CompetitorsOutput {
  const benefits = benefitList(p).map(lowerFirst);
  const competitors = pages.map(({ url, page }) => {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (!page)
      return {
        name: host,
        url,
        positioning: "Page inaccessible ou illisible : impossible de l'analyser automatiquement.",
        offers: [],
        prices: [],
        arguments: [],
        strengths: [],
        weaknesses: [],
        basis: "hypothese" as const,
      };
    return {
      name: page.title || host,
      url: page.url,
      positioning: page.description || page.headings[0] || "Positionnement non indiqué en haut de la page.",
      offers: page.headings.slice(0, 4),
      prices: page.prices,
      arguments: page.headings.slice(4, 7),
      strengths: [
        ...(page.description ? ["Message principal clair dès la description de la page"] : []),
        ...(page.prices.length ? ["Prix affichés publiquement"] : []),
      ],
      weaknesses: [
        ...(page.prices.length ? [] : ["Aucun prix visible sur la page lue"]),
        ...(page.description ? [] : ["Pas de description de la page (référencement moins soigné)"]),
      ],
      basis: "fourni" as const,
    };
  });
  return {
    competitors,
    differentiation: [
      benefits[0] ? `Mettez en avant ce qui vous distingue : ${benefits[0]}` : `Expliquez ce que votre ${noun(p)} fait mieux ou différemment`,
      "Affichez un prix clair et ce qu'il comprend",
      "Montrez-vous : votre histoire et vos coulisses rassurent plus qu'une grande marque",
      "Proposez un service que les concurrents n'affichent pas (délai, suivi, garantie réelle)",
    ],
    opportunities: [
      ...(competitors.some((c) => (c.weaknesses as string[]).includes("Aucun prix visible sur la page lue"))
        ? ["Certains concurrents n'affichent pas leurs prix : un prix clair peut vous démarquer"]
        : []),
      "Les avis de leurs clients (Google, réseaux) révèlent souvent ce qui manque : lisez-les",
      ...(notes ? ["Vos notes indiquent des pistes à exploiter : comparez-les à votre offre"] : []),
    ],
    limits:
      "Analyse limitée aux pages publiques lues et à vos notes : elle ne connaît ni les ventes, ni le trafic, ni la satisfaction des clients de vos concurrents.",
  };
}
