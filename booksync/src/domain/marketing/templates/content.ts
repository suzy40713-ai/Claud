import type { ContentOutput } from "../tools/content";
import { benefitList, clean, lowerFirst, noun, priceText, rotate, type ProductInfo } from "./common";

type Values = { platform: string; format: string; goal: string };

type Idea = { title: string; hook: string; beats: string[]; slides: string[]; product: string };

function hashtags(p: ProductInfo, platform: string) {
  const fromName = clean(p.name.toLowerCase())
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  const cat: Record<string, string[]> = {
    physique: ["faitmain", "petitemarque", "idéecadeau"],
    numerique: ["astuce", "apprendre", "ebook"],
    service: ["entrepreneur", "conseil", "indépendant"],
    formation: ["formation", "apprendre", "astuce"],
    abonnement: ["box", "découverte", "abonnement"],
    autre: ["entrepreneur", "astuce", "nouveauté"],
  };
  const plat = platform === "tiktok" ? "tiktokfrance" : platform === "linkedin" ? "entrepreneuriat" : "france";
  return [fromName.slice(0, 30), ...(cat[p.category] ?? cat.autre), plat].filter(Boolean).slice(0, 5);
}

export function contentTemplate(p: ProductInfo, v: Values, seed = 0): ContentOutput {
  const b = benefitList(p).map(lowerFirst);
  const price = priceText(p);
  const made = p.category === "service" || p.category === "formation" ? "préparé" : "fabriqué";
  const BANK: Record<string, Idea[]> = {
    decouvrir: [
      { title: "Présentation express", hook: `${p.name} en 15 secondes.`, beats: ["Plan du produit.", "Ce que c'est, en une phrase.", "À qui ça sert."], slides: [`Voici ${p.name}`, "C'est quoi ?", "C'est pour qui ?"], product: `Le produit en gros plan, nom bien visible.` },
      { title: "Ce que personne ne sait", hook: `3 choses que vous ne savez pas sur ${p.name}.`, beats: ["Chose n°1.", "Chose n°2.", "Chose n°3, la plus surprenante."], slides: ["Chose n°1", "Chose n°2", "Chose n°3"], product: "Montrer chaque détail mentionné." },
      { title: "Premier contact", hook: "Je vous présente ce sur quoi je travaille depuis des mois.", beats: ["Qui vous êtes.", "Ce que vous avez créé.", "Pourquoi."], slides: ["Qui je suis", "Ce que j'ai créé", "Pourquoi"], product: `${p.name} posé sur la table, prise de vue simple.` },
      { title: "Le déballage", hook: `Ouvrons ${p.name} ensemble.`, beats: ["Le paquet ou l'écran d'accueil.", "Ce qu'il y a dedans.", "Premier avis honnête."], slides: ["L'emballage", "Le contenu", "Le premier avis"], product: "Le produit sorti de son emballage." },
      { title: "Pour qui ?", hook: `${p.name}, c'est pour vous si…`, beats: ["Situation 1.", "Situation 2.", "Situation 3."], slides: ["Si vous…", "Si vous…", "Et si vous…"], product: "Le produit à la fin, avec le nom." },
      { title: "Une journée avec", hook: `Une journée avec ${p.name}.`, beats: ["Le matin.", "La journée.", "Le soir."], slides: ["Le matin", "La journée", "Le soir"], product: "Le produit à chaque moment de la journée." },
    ],
    eduquer: [
      { title: "L'astuce utile", hook: "L'astuce que j'aurais aimé connaître plus tôt.", beats: ["Le problème.", "L'astuce, étape par étape.", "Le résultat."], slides: ["Le problème", "L'astuce", "Le résultat"], product: `Mentionner que ${p.name} va plus loin.` },
      { title: "Les 3 erreurs", hook: "3 erreurs que tout le monde fait.", beats: ["Erreur n°1 et comment l'éviter.", "Erreur n°2.", "Erreur n°3."], slides: ["Erreur n°1", "Erreur n°2", "Erreur n°3"], product: `${p.name} comme solution à la dernière erreur.` },
      { title: "Mythe ou réalité", hook: "On m'a dit ça… c'est faux.", beats: ["L'idée reçue.", "Pourquoi c'est faux.", "Ce qui marche vraiment."], slides: ["L'idée reçue", "La vérité", "Ce qui marche"], product: "Le produit comme exemple de ce qui marche." },
      { title: "Le tuto", hook: "Je vous montre comment faire en 30 secondes.", beats: ["Étape 1.", "Étape 2.", "Étape 3."], slides: ["Étape 1", "Étape 2", "Étape 3"], product: "Le produit utilisé pendant le tuto." },
      { title: "La question qu'on me pose", hook: "La question qu'on me pose le plus souvent.", beats: ["La question.", "La réponse simple.", "Un exemple."], slides: ["La question", "La réponse", "Un exemple"], product: "Le produit en exemple." },
      { title: "La checklist", hook: "Sauvegardez cette liste.", beats: ["Point 1.", "Point 2.", "Point 3."], slides: ["Point 1", "Point 2", "Point 3"], product: `${p.name} en dernier point de la liste.` },
    ],
    confiance: [
      { title: "Les coulisses", hook: `Comment ${p.name} est ${made}.`, beats: ["Le début.", "L'étape la plus délicate.", "Le résultat."], slides: ["Le début", "L'étape délicate", "Le résultat"], product: "Le produit fini à la fin." },
      { title: "Mon histoire", hook: "Pourquoi j'ai tout commencé.", beats: ["Le déclic.", "Les premiers essais.", "Aujourd'hui."], slides: ["Le déclic", "Les débuts", "Aujourd'hui"], product: `${p.name} comme aboutissement.` },
      { title: "Ma galère de la semaine", hook: "Tout ne se passe pas toujours comme prévu…", beats: ["Le problème rencontré.", "Comment vous l'avez réglé.", "Ce que vous avez appris."], slides: ["Le problème", "La solution", "La leçon"], product: "Le produit amélioré grâce à ça." },
      { title: "Mes engagements", hook: "Ce que je vous promets (et ce que je ne promets pas).", beats: ["Engagement 1.", "Engagement 2.", "Ce que vous ne trouverez pas chez moi."], slides: ["Engagement 1", "Engagement 2", "Ce que je refuse"], product: "Le produit qui illustre ces engagements." },
      { title: "Réponse à un commentaire", hook: "On m'a posé cette question en commentaire…", beats: ["Lire le commentaire.", "Répondre honnêtement.", "Montrer la preuve."], slides: ["La question", "Ma réponse", "La preuve"], product: "Le produit comme preuve." },
      { title: "Un vrai retour", hook: "Le premier retour que j'ai reçu.", beats: ["Le contexte.", "Le retour (avec accord de la personne).", "Ce que ça vous a fait."], slides: ["Le contexte", "Le retour", "Mon ressenti"], product: "Le produit concerné." },
    ],
    vendre: [
      { title: "Pourquoi le choisir", hook: `3 raisons de choisir ${p.name}.`, beats: [b[0] ? `Raison 1 : ${b[0]}.` : "Raison 1.", b[1] ? `Raison 2 : ${b[1]}.` : "Raison 2.", b[2] ? `Raison 3 : ${b[2]}.` : "Raison 3."], slides: ["Raison 1", "Raison 2", "Raison 3"], product: "Le produit à chaque raison." },
      { title: "Ce que vous recevez", hook: price ? `Voilà ce que vous avez pour ${price}.` : "Voilà exactement ce que vous recevez.", beats: ["Élément 1.", "Élément 2.", "Le petit plus."], slides: ["Inclus", "Inclus", "Le petit plus"], product: "Chaque élément montré." },
      { title: "Avant / après", hook: "Avant… et après.", beats: ["Avant, sans le produit.", "La transition.", "Après, avec le produit."], slides: ["Avant", "Pendant", "Après"], product: "Le produit au moment de la transition." },
      { title: "La réponse à l'hésitation", hook: "Vous hésitez encore ? Normal.", beats: ["L'hésitation fréquente.", "La réponse honnête.", "Comment commander."], slides: ["L'hésitation", "La réponse", "Comment commander"], product: "Le produit et le lien." },
      { title: "Le bon moment", hook: "Le meilleur moment pour l'utiliser.", beats: ["La situation.", "Comment le produit aide.", "Où le trouver."], slides: ["La situation", "La solution", "Où le trouver"], product: "Le produit en situation." },
      { title: "Comment commander", hook: `Commander ${p.name}, c'est simple.`, beats: ["Où cliquer.", "Ce qui se passe ensuite.", "Quand vous le recevez."], slides: ["Où cliquer", "Ensuite", "La réception"], product: "L'écran de commande ou le produit livré." },
    ],
  };
  const ctas: Record<string, string> = {
    decouvrir: "Abonnez-vous pour voir la suite.",
    eduquer: "Sauvegardez pour plus tard et suivez-moi pour d'autres astuces.",
    confiance: "Posez-moi vos questions en commentaire.",
    vendre: p.url ? "Le lien est dans la bio." : "Écrivez-moi en message pour commander.",
  };
  const ideas = rotate(BANK[v.goal] ?? BANK.vendre, seed).slice(0, 5);
  const tags = hashtags(p, v.platform);
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  const pieces = ideas.map((i) => ({
    title: i.title,
    hook: i.hook,
    development: v.format === "carousel" ? [i.hook, ...i.slides, ctas[v.goal] ?? ctas.vendre] : v.format === "post" ? i.beats : i.beats,
    productMoment: i.product,
    cta: ctas[v.goal] ?? ctas.vendre,
    caption: `${i.hook} ${b[0] ? `${p.name} : ${b[0]}.` : `${p.name}, ${noun(p)} à découvrir.`} ${ctas[v.goal] ?? ctas.vendre}`,
    hashtags: tags,
    onScreenText: v.format === "video" ? i.hook : "",
  }));

  return {
    pieces,
    calendar: pieces.map((x, i) => ({ day: days[i], piece: x.title })),
    tips:
      v.format === "carousel"
        ? ["La première slide doit donner envie de faire défiler : une promesse claire.", "Une idée par slide, texte en gros.", "Dernière slide : un seul appel à l'action."]
        : v.format === "post"
          ? ["La première ligne doit donner envie de lire la suite.", "Des paragraphes courts, une photo réelle du produit.", "Terminez par une question pour faire réagir."]
          : ["L'accroche doit apparaître dans les 2 premières secondes, en texte à l'écran.", "Filmez à la lumière du jour, téléphone à la verticale.", "Pas besoin de montrer votre visage : mains, produit et voix off suffisent."],
  };
}
