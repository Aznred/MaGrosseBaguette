import type { Ingredient, Sandwich } from "./types";
import type { QuantitesUtilisation } from "./pricing";

export interface ShoppingListLine {
  ingredientName: string;
  quantity: number;
  unit: "g" | "u";
  /** Référence ingrédient si trouvé (pour afficher "Acheter X × produit") */
  ingredient?: Ingredient;
  /** Nombre de paquets/unités à acheter (selon poidsTotal du produit) */
  packsToBuy?: number;
}

const PAIN_UNITES_PAR_SANDWICH = 1;

interface Row {
  ingredientName: string;
  quantity: number;
  unit: "g" | "u";
  ingredient?: Ingredient;
}

function expandSandwich(
  sandwich: Sandwich,
  count: number,
  qtes: QuantitesUtilisation
): Row[] {
  const rows: Row[] = [];
  rows.push({
    ingredientName: sandwich.pain.nom,
    quantity: PAIN_UNITES_PAR_SANDWICH * count,
    unit: "u",
    ingredient: sandwich.pain,
  });
  rows.push({
    ingredientName: sandwich.proteine.nom,
    quantity: qtes.proteine * count,
    unit: "g",
    ingredient: sandwich.proteine,
  });
  if (sandwich.fromage) {
    rows.push({
      ingredientName: sandwich.fromage.nom,
      quantity: qtes.fromage * count,
      unit: "g",
      ingredient: sandwich.fromage,
    });
  }
  if (sandwich.sauce) {
    rows.push({
      ingredientName: sandwich.sauce.nom,
      quantity: qtes.sauce * count,
      unit: "g",
      ingredient: sandwich.sauce,
    });
  }
  (sandwich.legumes ?? []).forEach((leg) => {
    rows.push({
      ingredientName: leg.nom,
      quantity: qtes.legumes * count,
      unit: "g",
      ingredient: leg,
    });
  });
  return rows;
}

/** À partir des quantités de sandwichs (production recommandée), calcule la liste de courses agrégée.
 * Si ingredients est fourni, on enrichit chaque ligne avec l'ingrédient correspondant et packsToBuy. */
export function getShoppingListFromProduction(
  sandwichQuantities: { name: string; quantity: number }[],
  sandwiches: Sandwich[],
  quantites: QuantitesUtilisation,
  ingredients?: Ingredient[]
): ShoppingListLine[] {
  const byKey = new Map<string, { line: ShoppingListLine; ingredient?: Ingredient }>();
  for (const { name, quantity } of sandwichQuantities) {
    if (quantity <= 0) continue;
    const sandwich = sandwiches.find((s) => s.nom === name);
    if (!sandwich) continue;
    const lines = expandSandwich(sandwich, quantity, quantites);
    for (const row of lines) {
      const key = `${row.ingredientName}|${row.unit}`;
      const existing = byKey.get(key);
      const ing = row.ingredient ?? ingredients?.find((i) => i.nom === row.ingredientName);
      if (existing) {
        existing.line.quantity += row.quantity;
        if (ing && !existing.ingredient) existing.ingredient = ing;
      } else {
        byKey.set(key, {
          line: { ingredientName: row.ingredientName, quantity: row.quantity, unit: row.unit },
          ingredient: ing,
        });
      }
    }
  }
  return Array.from(byKey.values()).map(({ line, ingredient }) => {
    if (ingredient && ingredient.poidsTotal > 0) {
      const packsToBuy = Math.ceil(line.quantity / ingredient.poidsTotal);
      return { ...line, ingredient, packsToBuy };
    }
    return { ...line, ingredient };
  });
}
