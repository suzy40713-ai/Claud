import { CHANNELS } from "../tools/options";
import type { Strategy } from "../tools/strategy";
import { audienceOf, benefitList, lowerFirst, noun, pick, priceText, type ProductInfo } from "./common";

type Values = { objective: string; time: string; budget: string; channels: string[] };

const GOALS: Record<string, { label: string; cta: string; week3: string; week4: string; measure: string }> = {
  ventes: { label: "faire vos premières ventes", cta: "proposer l'achat avec le lien", week3: "Donner confiance et proposer l'achat", week4: "Relancer et vendre", measure: "Ventes" },
  notoriete: { label: "vous faire connaître", cta: "inviter à vous suivre", week3: "Multiplier les occasions d'être vu", week4: "Collaborer et être partagé", measure: "Nouveaux abonnés" },
  audience: { label: "construire une communauté", cta: "inviter à commenter et à s'inscrire", week3: "Faire participer votre communauté", week4: "Fidéliser", measure: "Commentaires et messages" },
  relance: { label: "relancer vos ventes", cta: "rappeler l'offre avec le lien", week3: "Rappeler votre offre", week4: "Relancer les anciens clients", measure: "Ventes" },
};

const TIME: Record<string, { minutes: string; light: boolean }> = {
  "1-2h": { minutes: "10 à 15 minutes", light: true },
  "3-5h": { minutes: "30 à 40 minutes", light: false },
  "5h+": { minutes: "environ une heure", light: false },
};

const AD_DAILY: Record<string, number> = { "50": 2, "200": 5, "200+": 10 };

function label(v: string) {
  return CHANNELS.find((c) => c.value === v)?.label ?? v;
}

/** Stratégie 30 jours : 3 actions par jour, adaptées au temps, au budget et aux canaux choisis. */
export function strategyTemplate(p: ProductInfo, v: Values, seed = 0): Strategy {
  const goal = GOALS[v.objective] ?? GOALS.ventes;
  const time = TIME[v.time] ?? TIME["3-5h"];
  const channels = v.channels.map(label);
  const social = channels.filter((c) => !/Email|Bouche/.test(c));
  const main = social[0] ?? channels[0] ?? "Instagram";
  const benefits = benefitList(p);
  const audience = audienceOf(p);
  const price = priceText(p);
  const adPerDay = AD_DAILY[v.budget] ?? 0;

  const ideas: Record<number, string[]> = {
    1: [
      `Vidéo « Qui je suis et pourquoi j'ai créé ${p.name} »`,
      `Présenter ${p.name} en 3 phrases face caméra ou en voix off`,
      "Montrer votre lieu de travail ou votre bureau",
      `Le problème qui vous a donné l'idée de ${p.name}`,
      "Un conseil gratuit lié à votre domaine",
      "Répondre à la question « c'est pour qui ? »",
    ],
    2: [
      `Démonstration de ${p.name} en 20 secondes`,
      benefits[0] ? `Zoom sur un avantage : ${lowerFirst(benefits[0])}` : `Ce que contient exactement ${p.name}`,
      `Les coulisses : comment ${p.name} est ${p.category === "service" || p.category === "formation" ? "préparé" : "fabriqué"}`,
      "Une erreur fréquente que votre produit évite",
      benefits[1] ? `Zoom sur un avantage : ${lowerFirst(benefits[1])}` : "Avant / après avec votre produit",
      "Les 3 questions qu'on vous pose le plus",
    ],
    3: [
      "Répondre en vidéo à un commentaire ou une question reçue",
      "Partager un premier retour client (avec son accord) ou votre propre test",
      price ? `Expliquer ce qui est inclus pour ${price}` : "Expliquer ce que reçoit l'acheteur",
      "Comparer « avec / sans » votre produit",
      "Raconter une petite galère de création et comment vous l'avez réglée",
      `Annoncer clairement comment ${goal.cta.replace(/^proposer |^inviter à |^rappeler /, "")}`,
    ],
    4: [
      "Refaire votre contenu qui a le mieux marché, avec une nouvelle accroche",
      "Faire une série « jour 1, jour 2… » sur votre produit",
      "Proposer une collaboration à un créateur de votre domaine",
      "Une vidéo « 3 raisons de choisir " + p.name + " »",
      "Montrer les coulisses d'une commande ou d'une séance",
      "Un récapitulatif de tout ce que vous avez appris ce mois-ci",
    ],
  };
  const engage = [
    "Répondre à tous les commentaires et messages reçus",
    "Commenter sincèrement 5 publications de personnes de votre public",
    "Envoyer un message à 3 personnes de votre entourage qui pourraient être intéressées",
    "Rejoindre un groupe ou une communauté de votre domaine et y aider quelqu'un",
    "Remercier en message privé les personnes qui ont interagi",
    "Demander à un proche de partager votre publication",
  ];
  const prep = [
    "Noter les idées de contenus qui vous viennent dans un carnet",
    "Préparer la vidéo de demain (texte et lieu de tournage)",
    "Vérifier que le lien d'achat fonctionne et est visible sur votre profil",
    "Noter les questions et objections reçues",
    "Améliorer votre bio : qui vous êtes, ce que vous vendez, le lien",
    "Prendre 5 photos ou rushs du produit pour plus tard",
  ];

  const days: Strategy["days"] = [];
  for (let d = 1; d <= 30; d++) {
    const week = Math.min(4, Math.ceil(d / 7));
    if (d % 7 === 0 || d === 30) {
      days.push({
        day: d,
        theme: d === 30 ? "Bilan du mois" : `Bilan de la semaine ${week}`,
        actions: [
          { title: "Relever vos chiffres", detail: `Vues, messages, clics et ventes de la semaine, à noter dans « Mes résultats ».`, channel: "Préparation" },
          { title: "Repérer le contenu qui a le mieux marché", detail: "Notez son accroche et son sujet : vous le referez la semaine prochaine.", channel: main },
          {
            title: d === 30 ? "Préparer le mois suivant" : "Choisir le sujet principal de la semaine suivante",
            detail: d === 30 ? "Créez une nouvelle stratégie à partir de ce qui a fonctionné." : "Gardez ce qui marche, abandonnez ce qui ne donne rien.",
            channel: "Préparation",
          },
        ],
      });
      continue;
    }
    const channel = social.length ? pick(social, d + seed) : main;
    const idea = pick(ideas[week], d + seed);
    const publish = !time.light || d % 2 === 1;
    const third =
      adPerDay > 0 && d === 22
        ? {
            title: `Lancer une petite publicité test (${adPerDay} € par jour, 3 jours)`,
            detail: "Sur votre contenu qui a le mieux marché. Arrêtez si personne ne clique : rien n'est garanti.",
            channel: social.find((c) => /TikTok|Instagram|Facebook/.test(c)) ?? "Instagram",
          }
        : week >= 3 && d % 3 === 0 && channels.some((c) => /Email/.test(c))
          ? { title: "Envoyer un email à votre liste", detail: `Une nouvelle, un conseil, puis ${goal.cta}.`, channel: "Email / newsletter" }
          : { title: pick(prep, d + seed, 2), detail: `${time.minutes} maximum.`, channel: "Préparation" };
    days.push({
      day: d,
      theme: week === 1 ? "Se présenter" : week === 2 ? "Montrer le produit" : week === 3 ? goal.week3 : goal.week4,
      actions: [
        publish
          ? { title: `Publier : ${idea}`, detail: `Format court, ${time.minutes} de préparation. Terminez en invitant à ${goal.cta.replace(/^proposer |^inviter à |^rappeler /, "")}.`, channel }
          : { title: `Préparer : ${idea}`, detail: `À publier demain. ${time.minutes}.`, channel },
        { title: pick(engage, d + seed, 1), detail: "10 minutes, avec des messages personnels (pas de copier-coller).", channel: channels.some((c) => /Bouche/.test(c)) && d % 4 === 0 ? "Bouche-à-oreille et proches" : channel },
        third,
      ],
    });
  }

  return {
    summary: `Plan de 30 jours pour ${goal.label} avec ${p.name}, sur ${channels.join(", ")}. Semaine 1 : vous présenter. Semaine 2 : montrer le produit. Semaine 3 : ${goal.week3.toLowerCase()}. Semaine 4 : ${goal.week4.toLowerCase()}. ${adPerDay ? "La publicité payante n'arrive qu'après avoir testé des contenus gratuits." : "Tout est gratuit : aucune publicité payante."}`,
    positioning: `${p.name}, ${noun(p)}${audience ? ` pour ${lowerFirst(audience)}` : ""}${benefits[0] ? ` : ${lowerFirst(benefits[0])}` : ""}.`,
    pillars: [
      { title: "Le produit en vrai", description: "Démonstrations, coulisses, détails : montrer plutôt que décrire." },
      { title: "Les conseils", description: "Des astuces utiles liées à votre domaine, même pour ceux qui n'achètent pas." },
      { title: "Votre histoire", description: "Pourquoi vous faites ça, vos progrès, vos galères : ce qui donne confiance." },
    ],
    channels: channels.map((c) => ({
      channel: c,
      role: c === main ? "Canal principal : publication régulière" : /Email/.test(c) ? "Garder le contact et proposer l'achat" : /Bouche/.test(c) ? "Premiers clients et recommandations" : "Canal secondaire : réutiliser les contenus",
      frequency: c === main ? (time.light ? "3 à 4 fois par semaine" : "5 à 6 fois par semaine") : /Email/.test(c) ? "1 fois par semaine à partir de la semaine 3" : "2 à 3 fois par semaine",
    })),
    weeks: [
      { week: 1, focus: "Vous présenter et préparer vos profils" },
      { week: 2, focus: `Montrer ${p.name} sous tous les angles` },
      { week: 3, focus: goal.week3 },
      { week: 4, focus: goal.week4 },
    ],
    days,
    measure: [
      { metric: goal.measure, how: "À noter chaque semaine dans « Mes résultats »." },
      { metric: "Messages et commentaires reçus", how: "Compter ceux qui posent une vraie question sur le produit." },
      { metric: "Clics vers votre page", how: "Visibles dans les statistiques de votre profil ou de votre boutique." },
      { metric: "Contenu le plus vu", how: "Noter son accroche pour la réutiliser." },
    ],
    assumptions: [
      { text: `Les canaux choisis : ${channels.join(", ")}.`, basis: "fourni" },
      { text: `Le temps disponible (${v.time.replace("h", " h")} par semaine) et le budget indiqués.`, basis: "fourni" },
      { text: `Votre public est présent sur ${main}.`, basis: "hypothese" },
      { text: "Montrer le produit en vrai donne plus confiance qu'une simple photo.", basis: "hypothese" },
    ],
  };
}
