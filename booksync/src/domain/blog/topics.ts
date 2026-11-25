/**
 * Sujets du blog : les questions que se posent les débutants qui veulent vendre quelque chose.
 * Chaque sujet vise une recherche Google réelle (mot-clé principal) avec un angle concret.
 * L'agent les traite dans l'ordre et ne publie jamais deux fois le même mot-clé.
 */
export type BlogTopic = {
  /** Recherche Google visée (en minuscules). */
  keyword: string;
  /** Angle de l'article : ce que le lecteur doit pouvoir faire après lecture. */
  angle: string;
};

export const BLOG_TOPICS: BlogTopic[] = [
  { keyword: "quoi vendre quand on débute", angle: "choisir une première chose à vendre à partir de ce qu'on sait déjà faire" },
  { keyword: "comment trouver une idée de business", angle: "méthode simple en 4 étapes pour trouver une idée et la tester sans dépenser" },
  { keyword: "comment faire sa première vente", angle: "les actions concrètes de la première semaine pour obtenir un premier client" },
  { keyword: "comment fixer le prix de son produit", angle: "calculer un prix de départ à partir de ses coûts, du temps passé et de la valeur perçue" },
  { keyword: "comment trouver ses premiers clients", angle: "trouver ses premiers clients dans son entourage, sur les réseaux et en local, sans publicité payante" },
  { keyword: "comment vendre sur tiktok", angle: "publier des vidéos qui présentent un produit et amènent les gens à acheter" },
  { keyword: "comment vendre sur instagram", angle: "organiser son profil, ses publications et ses messages privés pour vendre" },
  { keyword: "comment écrire une description de produit qui vend", angle: "structure d'une fiche produit claire : bénéfices, preuves, réponse aux objections" },
  { keyword: "c'est quoi un client idéal", angle: "décrire son client idéal et s'en servir pour écrire ses messages" },
  { keyword: "comment analyser ses concurrents", angle: "étudier 3 concurrents gratuitement et trouver ce qui vous différencie" },
  { keyword: "comment faire une publicité tiktok", angle: "écrire le script d'une publicité courte : accroche, démonstration, appel à l'action" },
  { keyword: "idée de business sans argent", angle: "idées qui demandent du temps et des compétences plutôt qu'un investissement" },
  { keyword: "business en ligne pour débutant", angle: "les formes de business en ligne accessibles quand on part de zéro, avec leurs limites" },
  { keyword: "comment devenir auto-entrepreneur", angle: "les étapes pour déclarer une micro-entreprise en France et ce qu'il faut vérifier sur les sites officiels" },
  { keyword: "comment vendre ses créations", angle: "présenter, photographier et proposer ses créations à ses premiers acheteurs" },
  { keyword: "comment vendre un service en ligne", angle: "transformer une compétence en offre claire avec un prix et un livrable" },
  { keyword: "comment créer une offre irrésistible", angle: "construire une offre claire : promesse réaliste, contenu, prix, bonus et garantie honnête" },
  { keyword: "comment répondre aux objections des clients", angle: "répondre aux objections courantes (prix, confiance, timing) sans forcer la vente" },
  { keyword: "plan marketing simple pour débutant", angle: "un plan sur 30 jours : objectifs, contenus, échanges avec les clients" },
  { keyword: "comment publier tous les jours sans idée", angle: "trouver des idées de contenus à partir des questions de ses clients" },
  { keyword: "comment faire des photos de produit avec son téléphone", angle: "lumière, fond, angles et retouches simples pour des photos qui donnent confiance" },
  { keyword: "comment obtenir des avis clients", angle: "demander des avis au bon moment et les utiliser pour rassurer les futurs acheteurs" },
  { keyword: "comment fidéliser ses clients", angle: "faire revenir ses premiers clients : suivi, remerciement, offre de retour" },
  { keyword: "comment vendre en message privé", angle: "écrire des messages privés respectueux qui mènent à une vente, sans spammer" },
  { keyword: "comment tester une idée de produit", angle: "vérifier qu'une idée intéresse de vrais clients avant d'investir" },
  { keyword: "comment trouver sa niche", angle: "choisir un public précis et pourquoi cela facilite la vente" },
  { keyword: "comment rédiger une bio instagram qui vend", angle: "écrire une bio claire : pour qui, quoi, quel résultat, quel lien" },
  { keyword: "comment vendre sur vinted", angle: "vendre ses affaires sur Vinted : photos, prix, description et envoi" },
  { keyword: "comment gagner ses premiers euros en ligne", angle: "pistes réalistes pour un premier revenu en ligne, sans promesse de résultat" },
  { keyword: "erreurs à éviter quand on lance son business", angle: "les erreurs fréquentes des débutants et comment les éviter" },
  { keyword: "comment se motiver à lancer son projet", angle: "avancer par petites actions quotidiennes plutôt que d'attendre d'être prêt" },
  { keyword: "comment calculer sa marge", angle: "calculer sa marge et son bénéfice avec un exemple chiffré simple" },
  { keyword: "comment écrire une accroche", angle: "écrire les premières secondes d'une vidéo ou la première ligne d'un post pour retenir l'attention" },
  { keyword: "storytelling pour vendre", angle: "raconter l'histoire de son produit pour créer de la confiance, sans inventer" },
  { keyword: "comment créer un calendrier de contenu", angle: "organiser ses publications de la semaine en 30 minutes" },
  { keyword: "comment vendre à ses proches sans être gêné", angle: "parler de son projet à son entourage et demander du soutien sans malaise" },
  { keyword: "comment faire un lancement de produit", angle: "préparer un lancement sur 2 semaines : teasing, ouverture, relance" },
  { keyword: "comment utiliser l'ia pour son business", angle: "usages concrets de l'IA pour un débutant : textes, idées, organisation, et ses limites" },
  { keyword: "comment vendre des cours en ligne", angle: "proposer un cours ou un accompagnement à partir de ce qu'on maîtrise" },
  { keyword: "side hustle idées", angle: "idées d'activités à côté de ses études ou de son travail, avec le temps qu'elles demandent" },
  { keyword: "comment fixer ses tarifs freelance", angle: "choisir un tarif horaire ou au projet quand on débute en freelance" },
  { keyword: "comment créer une page de vente", angle: "les blocs d'une page de vente simple : promesse, bénéfices, preuves, prix, questions" },
  { keyword: "comment suivre ses ventes", angle: "noter ses ventes et ses dépenses chaque semaine pour savoir ce qui marche" },
  { keyword: "comment vendre sans site internet", angle: "vendre avec les réseaux sociaux, les messages et le bouche-à-oreille" },
  { keyword: "comment faire connaître son produit gratuitement", angle: "canaux gratuits : réseaux, groupes, partenariats locaux, entourage" },
  { keyword: "comment choisir un nom de marque", angle: "trouver un nom court, facile à retenir, et vérifier qu'il est disponible" },
  { keyword: "comment faire une étude de marché simple", angle: "valider son marché avec des questions à de vrais clients et des observations gratuites" },
  { keyword: "comment vendre des produits faits main", angle: "prix, présentation et canaux pour vendre des produits faits main" },
  { keyword: "comment créer un business avec son téléphone", angle: "ce qu'on peut lancer et gérer uniquement avec un smartphone" },
  { keyword: "comment relancer un client sans être insistant", angle: "relances polies et utiles après un premier contact" },
];
