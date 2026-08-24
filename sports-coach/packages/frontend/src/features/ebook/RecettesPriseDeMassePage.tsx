import { RecipeEbookPage } from "./RecipeEbookPage";

export function RecettesPriseDeMassePage() {
  return (
    <RecipeEbookPage
      productId="recettes-prise-de-masse"
      emoji="💪"
      eyebrow="Ebook · PDF · Recettes"
      titre="Recettes Prise de Masse"
      description="20 recettes caloriques et riches en protéines pour atteindre ton surplus plus facilement — sans avoir à te forcer à manger."
      contenu={[
        "20 recettes classées par moment de la journée : petits-déjeuners, déjeuners/dîners, collations",
        "Pour chaque recette : temps de préparation, nombre de portions et estimation calorique",
        "Des idées de shakes et collations denses en énergie pour les jours difficiles",
        "Des ingrédients simples, faciles à trouver en supermarché",
      ]}
    />
  );
}
