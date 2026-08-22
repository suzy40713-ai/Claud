import type { GroceryList, MealScan } from "@prisma/client";
import type { GroceryListDTO, MealScanDTO, GroceryItemDTO } from "@sports-coach/shared";

export function toGroceryListDTO(list: GroceryList): GroceryListDTO {
  return {
    id: list.id,
    items: list.items as unknown as GroceryItemDTO[],
    createdAt: list.createdAt.toISOString(),
  };
}

export function toMealScanDTO(scan: MealScan): MealScanDTO {
  return {
    id: scan.id,
    description: scan.description,
    calories: scan.calories,
    proteinesG: scan.proteinesG,
    glucidesG: scan.glucidesG,
    lipidesG: scan.lipidesG,
    confiance: scan.confiance as MealScanDTO["confiance"],
    adequationObjectif: scan.adequationObjectif as MealScanDTO["adequationObjectif"],
    commentaireObjectif: scan.commentaireObjectif,
    createdAt: scan.createdAt.toISOString(),
  };
}
