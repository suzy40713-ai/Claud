/**
 * « Je ne sais pas quoi vendre » : idées pour gagner ses premiers euros sans diplôme, à partir de
 * ce que la personne sait déjà faire. Modèles fixes (aucune IA). Les prix sont des points de
 * départ, à ajuster : aucun revenu n'est promis.
 */
import type { ProductCategory } from "@/domain/marketing/product";

export type LaunchIdea = {
  id: string;
  title: string;
  why: string;
  category: ProductCategory;
  /** Prix de départ conseillé, en centimes. */
  priceCents: number;
  /** Ce que le prix comprend (« la séance d'1 h », « le modèle »…). */
  unit: string;
  /** Avantages pour le client, une ligne chacun (repris dans la fiche produit). */
  benefits: string[];
  /** À qui le vendre. */
  audience: string;
  /** Les 3 premières actions, faisables cette semaine. */
  firstSteps: [string, string, string];
};

export type Talent = { id: string; label: string; emoji: string; ideas: LaunchIdea[] };

export const TALENTS: Talent[] = [
  {
    id: "numerique",
    label: "Je suis à l'aise avec le téléphone et l'ordi",
    emoji: "📱",
    ideas: [
      {
        id: "seniors",
        title: "Aide numérique pour les seniors",
        why: "Installer WhatsApp, faire une démarche en ligne, envoyer des photos : ce qui est simple pour toi bloque beaucoup de personnes âgées.",
        category: "service",
        priceCents: 2500,
        unit: "la séance d'1 h",
        benefits: ["Patience et explications simples", "À domicile ou en visio", "Aide sur les démarches du quotidien"],
        audience: "Les personnes âgées et leurs enfants qui n'ont pas le temps de les aider",
        firstSteps: [
          "Propose une séance gratuite à une personne âgée de ton entourage, en échange d'un avis",
          "Dépose une annonce dans ta boulangerie, ta pharmacie et sur Leboncoin",
          "Poste dans le groupe Facebook de ta ville",
        ],
      },
    ],
  },
  {
    id: "reseaux",
    label: "Je passe du temps sur TikTok ou Instagram",
    emoji: "🤳",
    ideas: [
      {
        id: "community",
        title: "Gestion Instagram pour les commerçants",
        why: "Boulangeries, coiffeurs, restaurants : beaucoup n'ont pas le temps de poster. Tu sais ce qui marche, eux non.",
        category: "service",
        priceCents: 15000,
        unit: "le mois (8 publications)",
        benefits: ["8 publications par mois", "Photos et vidéos prises sur place", "Aucune compétence demandée au commerçant"],
        audience: "Les commerçants et artisans de ton quartier",
        firstSteps: [
          "Repère 10 commerces près de chez toi dont l'Instagram est vide ou abandonné",
          "Prépare 3 exemples de publications pour l'un d'eux (gratuitement)",
          "Va leur montrer en personne ou envoie-leur un message",
        ],
      },
      {
        id: "ugc",
        title: "Vidéos UGC pour les marques",
        why: "Les marques paient des particuliers pour filmer des vidéos naturelles avec leurs produits. Pas besoin d'abonnés, juste de bonnes vidéos.",
        category: "service",
        priceCents: 8000,
        unit: "la vidéo",
        benefits: ["Vidéo verticale prête à publier", "Format naturel qui inspire confiance", "Livraison en 5 jours"],
        audience: "Les petites marques en ligne (cosmétique, déco, accessoires)",
        firstSteps: [
          "Filme 3 vidéos d'exemple avec des produits que tu as déjà chez toi",
          "Crée un portfolio simple (un dossier partagé ou une page Canva)",
          "Envoie un message à 10 petites marques que tu aimes",
        ],
      },
    ],
  },
  {
    id: "video",
    label: "Je sais monter des vidéos",
    emoji: "🎬",
    ideas: [
      {
        id: "montage",
        title: "Montage de vidéos courtes pour créateurs",
        why: "Les créateurs et coachs filment, mais détestent monter. Sous-titres, coupes, musique : tu peux le faire depuis ton téléphone.",
        category: "service",
        priceCents: 2500,
        unit: "la vidéo montée",
        benefits: ["Sous-titres et coupes dynamiques", "Livraison en 48 h", "Format TikTok, Reels et Shorts"],
        audience: "Les coachs, formateurs et créateurs qui publient régulièrement",
        firstSteps: [
          "Monte 3 vidéos d'exemple à partir de vidéos libres de droits",
          "Propose un premier montage gratuit à un créateur qui publie sans sous-titres",
          "Publie ton avant/après sur TikTok",
        ],
      },
    ],
  },
  {
    id: "creatif",
    label: "Je suis créatif(ve) sur Canva",
    emoji: "🎨",
    ideas: [
      {
        id: "templates",
        title: "Modèles Canva à vendre (planners, posts, CV)",
        why: "Tu crées un modèle une fois et tu peux le vendre autant de fois que tu veux, sans stock ni livraison.",
        category: "numerique",
        priceCents: 700,
        unit: "le modèle",
        benefits: ["Téléchargement immédiat", "Modifiable sur Canva gratuit", "Gain de temps pour l'acheteur"],
        audience: "Les entrepreneurs, étudiants et créateurs qui manquent de temps",
        firstSteps: [
          "Crée un premier pack de 10 modèles sur un thème précis (ex. posts Instagram pour coiffeuses)",
          "Mets-le en vente sur Etsy ou une boutique gratuite (Gumroad, Payhip)",
          "Montre la création en accéléré dans une vidéo TikTok",
        ],
      },
    ],
  },
  {
    id: "mode",
    label: "J'aime la mode et chiner",
    emoji: "👗",
    ideas: [
      {
        id: "revente",
        title: "Achat-revente de vêtements de seconde main",
        why: "Les vide-greniers et les lots en ligne regorgent de pièces revendues bien plus cher sur Vinted. Tu commences avec ce que tu as déjà.",
        category: "physique",
        priceCents: 1500,
        unit: "la pièce (prix moyen visé)",
        benefits: ["Pièces sélectionnées et en bon état", "Photos soignées et mesures précises", "Envoi rapide"],
        audience: "Les acheteurs Vinted qui cherchent des marques à petit prix",
        firstSteps: [
          "Vends 10 vêtements que tu ne portes plus pour apprendre (photos à la lumière du jour)",
          "Va dans un vide-grenier avec 30 € et achète 5 pièces de marque",
          "Note le prix d'achat et de vente de chaque pièce pour suivre ta marge",
        ],
      },
    ],
  },
  {
    id: "langue",
    label: "Je parle une autre langue",
    emoji: "🌍",
    ideas: [
      {
        id: "conversation",
        title: "Cours de conversation en visio",
        why: "Beaucoup de gens veulent juste pratiquer à l'oral avec quelqu'un de patient. Pas besoin d'être prof : tu parles, tu corriges, tu encourages.",
        category: "service",
        priceCents: 2000,
        unit: "la séance de 45 min",
        benefits: ["À l'oral, sans grammaire ennuyeuse", "En visio, depuis chez soi", "Horaires flexibles"],
        audience: "Les adultes qui préparent un voyage, un entretien ou un déménagement",
        firstSteps: [
          "Propose une séance d'essai gratuite de 20 minutes à 3 personnes",
          "Inscris-toi sur une plateforme comme Superprof ou italki pour tes premiers élèves",
          "Publie une vidéo « 3 phrases à connaître avant de partir en… »",
        ],
      },
    ],
  },
  {
    id: "ecole",
    label: "J'étais bon(ne) à l'école",
    emoji: "📚",
    ideas: [
      {
        id: "devoirs",
        title: "Aide aux devoirs (primaire, collège)",
        why: "Les parents cherchent quelqu'un de sérieux pour aider leurs enfants après l'école. Tu peux le faire chez eux ou en visio.",
        category: "service",
        priceCents: 1500,
        unit: "l'heure",
        benefits: ["Méthode et organisation", "Chez vous ou en visio", "Suivi avec les parents"],
        audience: "Les parents d'élèves de primaire et de collège",
        firstSteps: [
          "Préviens 10 parents de ton entourage que tu commences",
          "Dépose une annonce dans les écoles, boulangeries et sur Leboncoin",
          "Propose un prix de lancement aux 3 premières familles en échange d'un avis",
        ],
      },
    ],
  },
  {
    id: "musique",
    label: "Je joue d'un instrument",
    emoji: "🎸",
    ideas: [
      {
        id: "instrument",
        title: "Cours d'instrument pour débutants",
        why: "Un débutant n'a pas besoin d'un virtuose : il a besoin de quelqu'un qui lui apprend les 5 premiers morceaux.",
        category: "service",
        priceCents: 2000,
        unit: "le cours de 45 min",
        benefits: ["Premiers morceaux dès le 1er cours", "En visio ou à domicile", "Beaucoup de patience"],
        audience: "Les adultes qui ont toujours voulu jouer et les parents d'enfants débutants",
        firstSteps: [
          "Filme-toi en train de jouer un morceau connu, en 30 secondes",
          "Propose un cours d'essai gratuit à 3 personnes",
          "Poste ton annonce dans les groupes Facebook de ta ville",
        ],
      },
    ],
  },
  {
    id: "cuisine",
    label: "J'aime cuisiner",
    emoji: "🍳",
    ideas: [
      {
        id: "recettes",
        title: "Livre de recettes numérique",
        why: "Tes recettes de famille ou tes plats rapides peuvent devenir un e-book vendu en ligne, sans stock ni livraison.",
        category: "numerique",
        priceCents: 900,
        unit: "l'e-book",
        benefits: ["Recettes testées et simples", "Liste de courses incluse", "Téléchargement immédiat"],
        audience: "Les gens pressés qui veulent mieux manger sans y passer des heures",
        firstSteps: [
          "Choisis un thème précis (ex. 20 recettes en 15 minutes pour étudiants)",
          "Mets en page 10 recettes sur Canva avec tes propres photos",
          "Publie une recette par jour en vidéo avec le lien de l'e-book",
        ],
      },
    ],
  },
  {
    id: "organisation",
    label: "Je suis organisé(e)",
    emoji: "🗂️",
    ideas: [
      {
        id: "assistant",
        title: "Assistant(e) virtuel(le) pour indépendants",
        why: "Mails, factures, agenda, classement : beaucoup d'indépendants détestent l'administratif et paient pour s'en débarrasser.",
        category: "service",
        priceCents: 2000,
        unit: "l'heure",
        benefits: ["Moins de paperasse pour vous", "Travail à distance", "Disponible quelques heures par semaine"],
        audience: "Les indépendants, artisans et petits commerces débordés",
        firstSteps: [
          "Liste 5 tâches que tu sais faire (mails, factures, tableaux, réseaux…)",
          "Envoie un message à 10 indépendants de ton entourage ou de LinkedIn",
          "Propose 2 heures offertes au premier client contre un avis",
        ],
      },
    ],
  },
  {
    id: "photo",
    label: "J'aime prendre des photos",
    emoji: "📸",
    ideas: [
      {
        id: "portrait",
        title: "Photos portrait pour réseaux, CV et LinkedIn",
        why: "Tout le monde a besoin d'une belle photo de profil, mais personne n'aime ses selfies. Un bon téléphone et une belle lumière suffisent pour commencer.",
        category: "service",
        priceCents: 3000,
        unit: "la séance (5 photos retouchées)",
        benefits: ["5 photos retouchées", "Séance de 30 minutes", "Idéal pour LinkedIn et Instagram"],
        audience: "Les étudiants, demandeurs d'emploi et indépendants",
        firstSteps: [
          "Photographie 3 amis gratuitement pour créer ton portfolio",
          "Publie les avant/après (selfie contre ta photo) sur Instagram",
          "Propose un tarif étudiant dans les groupes de ta ville",
        ],
      },
    ],
  },
  {
    id: "animaux",
    label: "J'aime les animaux",
    emoji: "🐶",
    ideas: [
      {
        id: "petsitting",
        title: "Promenade et garde d'animaux",
        why: "Les propriétaires qui travaillent ou partent en vacances cherchent quelqu'un de confiance près de chez eux.",
        category: "service",
        priceCents: 1200,
        unit: "la promenade d'1 h",
        benefits: ["Promenade près de chez vous", "Photos envoyées pendant la sortie", "Disponible le week-end"],
        audience: "Les propriétaires de chiens qui travaillent toute la journée",
        firstSteps: [
          "Préviens les propriétaires de chiens de ton immeuble ou de ton quartier",
          "Inscris-toi sur une plateforme comme Rover ou Animaute",
          "Propose une première promenade gratuite pour te faire connaître",
        ],
      },
    ],
  },
];

export function findIdea(ideaId: string) {
  for (const t of TALENTS) {
    const idea = t.ideas.find((i) => i.id === ideaId);
    if (idea) return idea;
  }
  return null;
}

/** Fiche produit pré-remplie à partir d'une idée. */
export function ideaToProduct(idea: LaunchIdea) {
  return {
    name: idea.title,
    description: `${idea.why} Prix de départ conseillé : ${(idea.priceCents / 100).toLocaleString("fr-FR")} € ${idea.unit}.`,
    price: (idea.priceCents / 100).toFixed(2).replace(".", ","),
    category: idea.category,
    benefits: idea.benefits.join("\n"),
    targetAudience: idea.audience,
    url: "",
  };
}
