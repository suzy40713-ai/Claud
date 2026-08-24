import { RecipeEbookPage } from "./RecipeEbookPage";

export function RecettesRegimePage() {
  return (
    <RecipeEbookPage
      productId="recettes-regime"
      emoji="🥗"
      eyebrow="Ebook · PDF · Recettes"
      titre="Recettes Régime"
      description="20 recettes riches en protéines, faciles à préparer, pour manger équilibré pendant une perte de poids — sans te priver ni y passer des heures."
      contenu={[
        "20 recettes classées par moment de la journée : petits-déjeuners, déjeuners/dîners, collations",
        "Pour chaque recette : temps de préparation, nombre de portions et estimation calorique",
        "Des ingrédients simples, faciles à trouver en supermarché",
        "Des astuces pratiques pour gagner du temps et varier les plaisirs",
      ]}
      crossSell={{
        to: "/recettes-prise-de-masse",
        label: "En prise de masse ? Découvre l'ebook Recettes Prise de Masse →",
      }}
    />
  );
}
