import { EbookProductPage } from "./EbookProductPage";

export function GuideMusculationPage() {
  return (
    <EbookProductPage
      productId="guide-musculation-debutant"
      emoji="🏋️"
      eyebrow="Ebook · PDF · Guide"
      titre="Bases de la Musculation"
      description="Le programme simple pour bien débuter en musculation (full-body, 4 semaines), sans te blesser et sans perdre de temps."
      contenu={[
        "Les 3 principes qui comptent plus que tout quand on débute",
        "Un programme full-body complet sur 4 semaines (séances A/B détaillées, séries et repos inclus)",
        "Comment progresser semaine après semaine, sans deviner",
        "Les 5 erreurs de débutant les plus fréquentes à éviter",
      ]}
    />
  );
}
