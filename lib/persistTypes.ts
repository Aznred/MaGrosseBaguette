import type { Ingredient, Sandwich } from "./types";
import type { QuantitesUtilisation } from "./pricing";

export const NOMS_SANDWICHS_PAR_DEFAUT = [
  "Le Classique",
  "Le Gourmand",
  "Le Frais",
  "Le Croquant",
  "Le Chef",
  "Le Fondant",
  "Le Léger",
  "Le Rustique",
  "Le Signature",
  "Le Best Seller",
];

export interface PersistPayload {
  ingredients: Ingredient[];
  customSandwiches: Sandwich[];
  quantites: QuantitesUtilisation;
  sandwichNames: string[];
  /** Nom du sandwich -> nombre de menus vendus (pour compta) */
  ventesParNomSandwich?: Record<string, number>;
  /** Nom ingrédient boisson -> quantité vendue à l'unité */
  ventesBoissons?: Record<string, number>;
  /** Nom ingrédient dessert/snack -> quantité vendue à l'unité */
  ventesSnacks?: Record<string, number>;
}
