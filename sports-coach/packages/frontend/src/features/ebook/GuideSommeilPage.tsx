import { EbookProductPage } from "./EbookProductPage";

export function GuideSommeilPage() {
  return (
    <EbookProductPage
      productId="guide-sommeil-recuperation"
      emoji="😴"
      eyebrow="Ebook · PDF · Guide"
      titre="Dors Mieux, Progresse Plus Vite"
      description="Le guide pratique du sommeil et de la récupération pour progresser plus vite sans t'entraîner plus."
      contenu={[
        "Pourquoi le sommeil est le levier le plus sous-estimé en sport",
        "Une routine du soir en 5 points, simple à mettre en place",
        "Les signes de surentraînement à surveiller",
        "Une checklist hebdomadaire de récupération à réutiliser chaque semaine",
      ]}
    />
  );
}
