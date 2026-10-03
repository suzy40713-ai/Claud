import { classifyNiche } from "@/lib/ads/catalog";
import type { NormalizedAd, SearchFilters, SourceResult } from "@/lib/ads/types";

/**
 * Demo source — only active when DEMO_MODE=true. Every record is fictional
 * (invented brands, no real advertiser) and flagged `is_demo`, which the UI
 * renders with a visible "DÉMO" badge. It exists so the product can be
 * explored before the official API credentials are approved.
 */

type DemoSeed = Omit<NormalizedAd, "source" | "is_demo" | "source_url" | "media_urls" | "thumbnail_url" | "advertiser_id" | "end_date" | "description"> & {
  description?: string | null;
};

const SEEDS: DemoSeed[] = [
  { source_ad_id: "demo-001", advertiser: "Lumen Skin (démo)", title: "Le sérum qui révèle ton éclat", body: "Teint terne le matin ? Notre sérum à la vitamine C s'applique en 10 secondes. Résultat visible dès la première semaine selon nos utilisatrices.", cta: "Découvrir", media_type: "video", platforms: ["instagram", "facebook"], countries: ["FR"], languages: ["fr"], start_date: "2026-08-12", is_active: true },
  { source_ad_id: "demo-002", advertiser: "Nordik Fit (démo)", title: "Ta salle de sport tient dans un sac", body: "Élastiques de résistance + programme de 12 semaines. Entraîne-toi chez toi, sans abonnement, 20 minutes par jour.", cta: "J'en profite", media_type: "video", platforms: ["instagram", "tiktok"], countries: ["FR", "BE"], languages: ["fr"], start_date: "2026-09-01", is_active: true },
  { source_ad_id: "demo-003", advertiser: "Casa Calma (démo)", title: "Un salon apaisant en 3 objets", body: "Lampe tamisée, plaid en lin, diffuseur. Notre box déco transforme ta pièce en cocon. Livraison offerte dès 49 €.", cta: "Voir la box", media_type: "carousel", platforms: ["facebook", "instagram"], countries: ["FR"], languages: ["fr"], start_date: "2026-07-20", is_active: true },
  { source_ad_id: "demo-004", advertiser: "PawPal (démo)", title: "Fini les poils sur le canapé", body: "Notre brosse autonettoyante retire les poils morts en un geste. Ton chien adore, ton canapé aussi.", cta: "Acheter", media_type: "video", platforms: ["tiktok"], countries: ["FR"], languages: ["fr"], start_date: "2026-09-10", is_active: true },
  { source_ad_id: "demo-005", advertiser: "Voltaire Audio (démo)", title: "Des écouteurs pour courir sans les perdre", body: "Crochets souples, réduction de bruit, 30 h d'autonomie. Conçus pour le running et la salle de sport.", cta: "Commander", media_type: "image", platforms: ["facebook", "instagram"], countries: ["FR", "DE"], languages: ["fr"], start_date: "2026-06-05", is_active: false },
  { source_ad_id: "demo-006", advertiser: "Atelier Rive (démo)", title: "La veste qui va avec tout", body: "Coupe droite, coton bio, fabriquée au Portugal. Une seule veste, dix tenues. Retours gratuits sous 30 jours.", cta: "Découvrir la collection", media_type: "carousel", platforms: ["instagram"], countries: ["FR"], languages: ["fr"], start_date: "2026-09-15", is_active: true },
  { source_ad_id: "demo-007", advertiser: "Somna (démo)", title: "Tu te réveilles fatigué ?", body: "Notre oreiller ergonomique soutient ta nuque toute la nuit. Essai de 100 nuits : si tu ne dors pas mieux, on te rembourse.", cta: "Essayer 100 nuits", media_type: "video", platforms: ["facebook", "instagram"], countries: ["FR"], languages: ["fr"], start_date: "2026-05-28", is_active: true },
  { source_ad_id: "demo-008", advertiser: "Kitchen Lab (démo)", title: "3 repas sains en 15 minutes", body: "Le robot qui hache, cuit et mixe. Plus de 200 recettes guidées dans l'app. Parfait pour les soirs pressés.", cta: "Voir les recettes", media_type: "video", platforms: ["tiktok", "instagram"], countries: ["FR", "BE"], languages: ["fr"], start_date: "2026-08-30", is_active: true },
  { source_ad_id: "demo-009", advertiser: "Trailmade (démo)", title: "Le sac de randonnée ultra-léger", body: "780 g, 30 L, dos ventilé. Pensé par des randonneurs pour les longues journées en montagne.", cta: "En savoir plus", media_type: "image", platforms: ["facebook"], countries: ["FR"], languages: ["fr"], start_date: "2026-04-14", is_active: false },
  { source_ad_id: "demo-010", advertiser: "Lumen Skin (démo)", title: "Routine anti-rides en 2 étapes", body: "Crème de nuit + contour des yeux. Une routine simple, des ingrédients expliqués, sans parfum ajouté.", cta: "Composer ma routine", media_type: "carousel", platforms: ["instagram"], countries: ["FR"], languages: ["fr"], start_date: "2026-09-18", is_active: true },
  { source_ad_id: "demo-011", advertiser: "Cartable+ (démo)", title: "Les devoirs sans les cris", body: "Des fiches de révision ludiques pour les 6–10 ans. Ton enfant progresse à son rythme, toi tu respires.", cta: "Télécharger un extrait", media_type: "image", platforms: ["facebook", "instagram"], countries: ["FR"], languages: ["fr"], start_date: "2026-08-25", is_active: true },
  { source_ad_id: "demo-012", advertiser: "Pulse Coach (démo)", title: "Ton coach fitness dans ta poche", body: "Programmes de musculation personnalisés, suivi des séances et conseils nutrition. 7 jours d'essai gratuit.", cta: "Commencer l'essai", media_type: "video", platforms: ["tiktok", "instagram"], countries: ["FR", "ES"], languages: ["fr"], start_date: "2026-09-05", is_active: true },
  { source_ad_id: "demo-013", advertiser: "Verde Café (démo)", title: "Le café de spécialité livré chez toi", body: "Torréfié chaque semaine, moulu selon ta machine. Abonnement sans engagement, pause en un clic.", cta: "Choisir mon café", media_type: "image", platforms: ["instagram", "facebook"], countries: ["FR"], languages: ["fr"], start_date: "2026-07-02", is_active: true },
  { source_ad_id: "demo-014", advertiser: "Nomad Bags (démo)", title: "Voyage en cabine, même 10 jours", body: "La valise extensible qui respecte les dimensions cabine. Compartiments compressifs et port USB intégré.", cta: "Voir la valise", media_type: "video", platforms: ["facebook", "instagram"], countries: ["FR", "IT"], languages: ["fr"], start_date: "2026-06-18", is_active: false },
  { source_ad_id: "demo-015", advertiser: "Budgetly (démo)", title: "Où passe ton argent chaque mois ?", body: "L'app qui classe tes dépenses automatiquement et t'aide à épargner sans y penser. Gratuite pour commencer.", cta: "Installer l'app", media_type: "video", platforms: ["tiktok"], countries: ["FR"], languages: ["fr"], start_date: "2026-09-12", is_active: true },
  { source_ad_id: "demo-016", advertiser: "Glow Studio (démo)", title: "Le mascara qui ne coule pas", body: "Testé sous la pluie, au sport et à la plage. Volume naturel, démaquillage à l'eau tiède.", cta: "Je teste", media_type: "video", platforms: ["tiktok", "instagram"], countries: ["FR", "BE"], languages: ["fr"], start_date: "2026-09-20", is_active: true },
  { source_ad_id: "demo-017", advertiser: "Rolling Dog (démo)", title: "La laisse qui protège ton dos", body: "Amortisseur intégré et poignée ergonomique : les balades avec un chien qui tire deviennent agréables.", cta: "Découvrir", media_type: "image", platforms: ["facebook"], countries: ["FR"], languages: ["fr"], start_date: "2026-08-08", is_active: true },
  { source_ad_id: "demo-018", advertiser: "Skillset (démo)", title: "Apprends le montage vidéo en 30 jours", body: "Une formation en ligne avec projets concrets, corrigés par des monteurs professionnels. Certificat à la clé.", cta: "Voir le programme", media_type: "carousel", platforms: ["facebook", "instagram"], countries: ["FR"], languages: ["fr"], start_date: "2026-07-27", is_active: true },
];

function toNormalized(seed: DemoSeed): NormalizedAd {
  return {
    ...seed,
    description: seed.description ?? null,
    source: "demo",
    advertiser_id: null,
    end_date: seed.is_active ? null : seed.start_date,
    media_urls: [],
    thumbnail_url: null,
    source_url: null,
    is_demo: true,
  };
}

export const DEMO_ADS: NormalizedAd[] = SEEDS.map(toNormalized);

export function searchDemo(filters: SearchFilters, limit: number): SourceResult {
  const q = filters.q?.trim().toLowerCase();
  const offset = Number(filters.cursor ?? 0) || 0;
  const filtered = DEMO_ADS.filter((ad) => {
    const text = `${ad.advertiser} ${ad.title} ${ad.body}`.toLowerCase();
    if (q && !q.split(/\s+/).every((w) => text.includes(w))) return false;
    if (filters.niche && classifyNiche(text) !== filters.niche) return false;
    if (filters.format && ad.media_type !== filters.format) return false;
    if (filters.status === "active" && !ad.is_active) return false;
    if (filters.status === "inactive" && ad.is_active) return false;
    if (filters.dateFrom && ad.start_date && ad.start_date < filters.dateFrom) return false;
    if (filters.dateTo && ad.start_date && ad.start_date > filters.dateTo) return false;
    return true;
  });
  const page = filtered.slice(offset, offset + limit);
  return { ads: page, nextCursor: offset + limit < filtered.length ? String(offset + limit) : null };
}
