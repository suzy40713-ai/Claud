import { EbookProductPage } from "./EbookProductPage";

export function ProgrammeMaisonPage() {
  return (
    <EbookProductPage
      productId="programme-maison-sans-materiel"
      emoji="🏠"
      eyebrow="Ebook · PDF · Guide"
      titre="Cardio & Renfo Sans Matériel"
      description="Un programme de 4 semaines à faire à la maison, sans matériel, 20 à 30 minutes par séance."
      contenu={[
        "Un échauffement type à faire avant chaque séance",
        "Deux circuits progressifs (semaines 1-2 puis 3-4) avec formats effort/repos détaillés",
        "Des variantes pour adapter chaque exercice à ton niveau",
        "Des étirements de fin de séance pour bien récupérer",
      ]}
    />
  );
}
