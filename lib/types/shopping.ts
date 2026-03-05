import type { Ingredient, Sandwich } from "../types";

/** Sélection d'un sandwich avec le nombre de fois qu'il sera fait dans la semaine */
export interface SandwichSelection {
  sandwichId: string;
  sandwich: Sandwich;
  count: number;
}

/** Plan de sandwichs pour la semaine */
export interface WeeklySandwichPlan {
  selections: SandwichSelection[];
}

/** Unité d'affichage pour la quantité (grammes ou unités) */
export type ShoppingUnit = "g" | "u";

/** Ligne de la liste de courses : ingrédient agrégé avec quantités et coût */
export interface ShoppingItem {
  ingredientId: string;
  ingredientName: string;
  /** Quantité totale nécessaire (grammes ou unités selon le type d'ingrédient) */
  quantityNeeded: number;
  unit: ShoppingUnit;
  /** Quantité déjà en stock (saisie utilisateur) */
  stock: number;
  /** Quantité à acheter = quantityNeeded - stock (min 0) */
  toBuy: number;
  /** Prix estimé pour la quantité à acheter (€) */
  priceEstimated: number;
  /** Référence ingrédient pour recalcul du coût quand le stock change */
  ingredient: Ingredient;
}

/** Résultat du hook liste de courses */
export interface ShoppingListState {
  selections: SandwichSelection[];
  items: ShoppingItem[];
  totalEstimated: number;
  setSelectionCount: (sandwichId: string, count: number) => void;
  setStock: (ingredientId: string, stock: number) => void;
  generateShoppingList: () => void;
  addSelection: (sandwich: Sandwich) => void;
  removeSelection: (sandwichId: string) => void;
}
