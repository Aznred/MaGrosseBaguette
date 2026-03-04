import type { Ingredient, Sandwich } from "./types";

export interface QuantitesUtilisation {
  proteine: number;
  fromage: number;
  sauce: number;
  legumes: number; // par légume (grammes)
  boisson: number; // grammes ou unité
  dessert: number; // grammes ou unité
  emballage: number; // quantité par article d'emballage
}

export const QUANTITES_PAR_DEFAUT: QuantitesUtilisation = {
  proteine: 100,
  fromage: 30,
  sauce: 15,
  legumes: 30,
  boisson: 1,
  dessert: 1,
  emballage: 1,
};

export function coutPortion(ingredient: Ingredient, grammes: number): number {
  const base = ingredient.prixTotal / (ingredient.poidsTotal || 1);
  if (ingredient.modeTarif === "unite") {
    return base * grammes; // ici "grammes" représente un nombre d'unités
  }
  return base * grammes;
}

export function calculerCoutSandwich(
  base: Omit<Sandwich, "cout">,
  qtes: QuantitesUtilisation = QUANTITES_PAR_DEFAUT,
): number {
  const { proteine, fromage, sauce, legumes = [] } = base;
  const COUT_PAIN_FIXE = 0.5;

  const cout =
    COUT_PAIN_FIXE +
    coutPortion(proteine, qtes.proteine) +
    (fromage ? coutPortion(fromage, qtes.fromage) : 0) +
    (sauce ? coutPortion(sauce, qtes.sauce) : 0) +
    legumes.reduce((sum, leg) => sum + coutPortion(leg, qtes.legumes), 0);

  return Number(cout.toFixed(3));
}

export function calculerCoutMenu(
  sandwich: Sandwich,
  boisson: Ingredient,
  dessert: Ingredient,
  emballage: Ingredient[],
  qtes: QuantitesUtilisation = QUANTITES_PAR_DEFAUT,
): { coutEmballage: number; coutTotal: number } {
  const coutBoisson = coutPortion(boisson, qtes.boisson);
  const coutDessert = coutPortion(dessert, qtes.dessert);
  const coutEmballage = emballage.reduce(
    (sum, e) => sum + coutPortion(e, qtes.emballage),
    0,
  );

  const coutTotal = sandwich.cout + coutBoisson + coutDessert + coutEmballage;

  return {
    coutEmballage: Number(coutEmballage.toFixed(3)),
    coutTotal: Number(coutTotal.toFixed(3)),
  };
}

