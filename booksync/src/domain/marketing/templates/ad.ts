import { GOOGLE_LIMITS, type AdOutput } from "../tools/ad";
import { audienceOf, benefitList, clean, lowerFirst, noun, priceText, rotate, type ProductInfo } from "./common";

type Values = { platform: string; style: string; offer: string };

/** Coupe proprement à la longueur maximale (Google Ads). */
export function fit(text: string, max: number) {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1).replace(/\s+\S*$/, "");
  return (cut.length >= 8 ? cut : t.slice(0, max)).replace(/[,;:–-]+$/, "").trim();
}

const STOP = new Set(["le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "pour", "avec", "à", "au", "aux", "sur", "par", "dans", "qui", "que", "vos", "votre", "nos", "notre", "son", "sa", "ses"]);

function words(s: string) {
  return clean(s.toLowerCase().replace(/[«»"'’.,;:!?()]/g, " "))
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function adTemplate(p: ProductInfo, v: Values, seed = 0): AdOutput {
  const google = v.platform === "google";
  const benefits = benefitList(p);
  const b1 = benefits[0] ? lowerFirst(benefits[0]) : null;
  const b2 = benefits[1] ? lowerFirst(benefits[1]) : null;
  const audience = audienceOf(p);
  const price = priceText(p);
  const offer = clean(v.offer ?? "");
  const cta = p.category === "service" || p.category === "formation" ? "Réserver" : p.category === "abonnement" ? "S'abonner" : "Découvrir";
  const tail = [offer, price ? `${price}` : null].filter(Boolean).join(" · ");

  const STYLES: Record<string, Array<{ angle: string; headline: string; text: string; visual: string; script: string[] }>> = {
    probleme: [
      { angle: "Le problème d'abord", headline: `Marre de chercher ?`, text: `${audience ? `Pour ${lowerFirst(audience)} : ` : ""}${p.name}, la solution simple.${b1 ? ` Son point fort : ${b1}.` : ""}`, visual: "Plan 1 : la galère du quotidien. Plan 2 : le produit qui la règle.", script: ["Montrer le problème, sans parler.", `Texte à l'écran : « Il y a plus simple ».`, `Montrer ${p.name} en action.`, "Appel à l'action et lien."] },
      { angle: "La question directe", headline: `Et si c'était plus simple ?`, text: `${p.name} : ${b1 ?? `le ${noun(p)} pensé pour vous simplifier la vie`}. ${b2 ? `Et en plus : ${b2}.` : ""}`, visual: "Face caméra ou voix off, texte en gros à l'écran.", script: ["Poser la question qui fâche.", "Expliquer pourquoi c'est un vrai problème.", `Présenter ${p.name}.`, "Appel à l'action."] },
      { angle: "L'erreur fréquente", headline: `L'erreur que tout le monde fait`, text: `Beaucoup de gens se compliquent la vie. ${p.name} vous aide à l'éviter.${b1 ? ` En plus : ${b1}.` : ""}`, visual: "Plan sur l'erreur, puis sur la bonne façon de faire avec le produit.", script: ["« Arrêtez de faire ça. »", "Montrer l'erreur.", "Montrer la bonne méthode avec le produit.", "Lien en bio."] },
    ],
    demo: [
      { angle: "Démonstration en 15 s", headline: `${p.name} en 15 secondes`, text: `Regardez comment ça marche. ${b1 ? `Résultat : ${b1}.` : ""}`, visual: "Démonstration filmée au téléphone, plans rapprochés, sans musique forte.", script: ["Plan large du produit.", "Utilisation, étape 1.", "Utilisation, étape 2.", "Résultat final et lien."] },
      { angle: "Ce qu'il y a dedans", headline: `Ce que contient ${p.name}`, text: `On vous montre tout, sans filtre. ${price ? `Prix : ${price}.` : ""}`, visual: "Déballage ou visite de ce qui est inclus.", script: ["« Voilà ce que vous recevez. »", "Montrer chaque élément.", "Montrer le détail qui fait la différence.", "Appel à l'action."] },
      { angle: "Le détail qui change tout", headline: b1 ? fit(`Le secret : ${b1}`, 60) : `Le détail qui change tout`, text: `${p.name}, ${noun(p)} pensé dans les moindres détails.`, visual: "Gros plan sur un détail du produit.", script: ["Gros plan mystérieux.", "Révéler le détail.", "Expliquer pourquoi il compte.", "Lien."] },
    ],
    story: [
      { angle: "Pourquoi je l'ai créé", headline: `Pourquoi j'ai créé ${p.name}`, text: `Au départ, il y avait un problème que je voulais régler. Aujourd'hui, ${p.name} est là.${b1 ? ` Son point fort : ${b1}.` : ""}`, visual: "Voix off sur des images des coulisses.", script: ["« Il y a quelques mois, j'avais un problème… »", "Les premiers essais.", `Le résultat : ${p.name}.`, "Invitation à découvrir."] },
      { angle: "Une journée avec le produit", headline: `Une journée avec ${p.name}`, text: `Du matin au soir, voici comment ${p.name} trouve sa place.`, visual: "Montage de petites scènes du quotidien.", script: ["Matin.", "Midi.", "Soir.", "Appel à l'action."] },
      { angle: "Les coulisses", headline: `Les coulisses de ${p.name}`, text: `Fait avec soin, étape par étape. ${b2 ? `Et le petit plus : ${b2}.` : ""}`, visual: "Coulisses de fabrication ou de préparation.", script: ["Le début.", "L'étape la plus délicate.", "Le résultat.", "Lien."] },
    ],
    "avant-apres": [
      { angle: "Avant / après", headline: `Avant / après ${p.name}`, text: `Avant : on se complique la vie. Après : ${b1 ?? "c'est plus simple"}.`, visual: "Écran partagé avant / après.", script: ["« Avant… »", "« Après… »", `Montrer ${p.name}.`, "Lien."] },
      { angle: "Sans / avec", headline: `Sans ou avec ${p.name} ?`, text: `La différence se voit tout de suite. ${price ? `${price}.` : ""}`, visual: "Deux plans côte à côte.", script: ["Sans.", "Avec.", "La différence en une phrase.", "Appel à l'action."] },
      { angle: "La transformation", headline: `Le changement en une image`, text: `${p.name} : ${b1 ?? `un ${noun(p)} qui fait la différence`}.`, visual: "Transition rapide de l'avant vers l'après.", script: ["Situation de départ.", "Transition.", "Résultat.", "Lien."] },
    ],
    humour: [
      { angle: "La situation trop familière", headline: `On a tous vécu ça`, text: `Vous vous reconnaissez ? ${p.name} est là pour ça.`, visual: "Petit sketch d'une situation du quotidien, exagérée.", script: ["La situation ratée.", "La réaction exagérée.", `L'arrivée de ${p.name}.`, "Lien."] },
      { angle: "Moi vs. moi avec le produit", headline: `Moi vs. moi avec ${p.name}`, text: `Même personne, deux résultats. ${b1 ? `La différence : ${b1}.` : ""}`, visual: "Deux versions de vous, deux tenues.", script: ["Moi sans.", "Moi avec.", "Clin d'œil.", "Lien."] },
      { angle: "POV", headline: `POV : vous découvrez ${p.name}`, text: `Ce moment où tout devient plus simple.`, visual: "Format « POV » en caméra subjective.", script: ["Texte POV à l'écran.", "La découverte.", "La réaction.", "Lien."] },
    ],
  };

  const variants = rotate(STYLES[v.style] ?? STYLES.probleme, seed).map((x) => {
    const text = [x.text, tail].filter(Boolean).join(" ");
    return {
      angle: x.angle,
      headline: google ? fit(x.headline, GOOGLE_LIMITS.headline) : x.headline,
      primaryText: google ? fit(text, GOOGLE_LIMITS.description) : clean(text),
      cta,
      visual: google ? "Annonce texte (Réseau de Recherche) : pas de visuel." : x.visual,
      script: google
        ? []
        : x.script.map((t, i) => ({ time: ["0-2 s", "2-6 s", "6-12 s", "12-15 s"][i] ?? "", text: t })),
    };
  });

  const base = [...new Set([...words(p.name), ...benefits.flatMap(words)])].slice(0, 6);
  const keywords = google
    ? [...new Set([
        clean(p.name.toLowerCase()),
        ...base.map((w) => `${w} ${noun(p).split(" ")[0]}`),
        `acheter ${clean(p.name.toLowerCase())}`,
        `${noun(p)} ${base[0] ?? ""}`.trim(),
        ...base,
      ])].slice(0, 10)
    : [];

  return {
    variants,
    keywords,
    targeting: [
      audience ? `Votre public indiqué : ${lowerFirst(audience)}.` : "Commencez large (âge 18-55, France) et laissez la plateforme apprendre.",
      "Centres d'intérêt liés à votre domaine (hypothèse à tester).",
      "Personnes qui ont déjà interagi avec votre compte (si la plateforme le propose).",
    ],
    testPlan: "Testez les 3 variantes en même temps avec un petit budget (2 à 5 € par jour chacune) pendant 3 à 4 jours. Gardez celle qui a le plus de clics pour le moins cher, arrêtez les autres. Notez les résultats dans « Mes résultats ». Aucun résultat n'est garanti.",
    rules: [
      "Pas de promesse de résultat garanti ni d'allégation santé non prouvée.",
      "Une offre affichée doit être réelle et ses conditions claires.",
      "Pas de faux avis, de faux compte à rebours ou de fausse rareté.",
      google ? "Google : titres de 30 caractères et descriptions de 90 caractères maximum." : "La plateforme vérifie chaque publicité avant diffusion : évitez les textes trop agressifs.",
    ],
  };
}
