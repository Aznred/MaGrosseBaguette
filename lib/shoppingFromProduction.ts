import type { Ingredient, Sandwich } from "./types";
import type { QuantitesUtilisation } from "./pricing";

export interface ShoppingListLine {
  ingredientName: string;
  quantity: number;
  unit: "g" | "u";
}

const PAIN_UNITES_PAR_SANDWICH = 1;

function expandSandwich(
  sandwich: Sandwich,
  count: number,
  qtes: QuantitesUtilisation
): ShoppingListLine[] {
  const rows: ShoppingListLine[] = [];
  rows.push({
    ingredientName: sandwich.pain.nom,
    quantity: PAIN_UNITES_PAR_SANDWICH * count,
    unit: "u",
  });
  rows.push({
    ingredientName: sandwich.proteine.nom,
    quantity: qtes.proteine * count,
    unit: "g",
  });
  if (sandwich.fromage) {
    rows.push({
      ingredientName: sandwich.fromage.nom,
      quantity: qtes.fromage * count,
      unit: "g",
    });
  }
  if (sandwich.sauce) {
    rows.push({
      ingredientName: sandwich.sauce.nom,
      quantity: qtes.sauce * count,
      unit: "g",
    });
  }
  (sandwich.legumes ?? []).forEach((leg) => {
    rows.push({
      ingredientName: leg.nom,
      quantity: qtes.legumes * count,
      unit: "g",
    });
  });
  return rows;
}

/** À partir des quantités de sandwichs (production recommandée), calcule la liste de courses agrégée */
export function getShoppingListFromProduction(
  sandwichQuantities: { name: string; quantity: number }[],
  sandwiches: Sandwich[],
  quantites: QuantitesUtilisation
): ShoppingListLine[] {
  const byName = new Map<string, ShoppingListLine>();
  for (const { name, quantity } of sandwichQuantities) {
    if (quantity <= 0) continue;
    const sandwich = sandwiches.find((s) => s.nom === name);
    if (!sandwich) continue;
    const lines = expandSandwich(sandwich, quantity, quantites);
    for (const line of lines) {
      const key = `${line.ingredientName}|${line.unit}`;
      const existing = byName.get(key);
      if (existing) existing.quantity += line.quantity;
      else byName.set(key, { ...line });
    }
  }
  return Array.from(byName.values());
}
