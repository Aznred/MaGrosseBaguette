import { v4 as uuid } from "uuid";
import type { Ingredient, Menu, Sandwich } from "./types";
import {
  calculerCoutSandwich,
  coutPortion,
  type QuantitesUtilisation,
  QUANTITES_PAR_DEFAUT,
} from "./pricing";
import { cleanIngredientName } from "./ingredientName";
import { NOMS_SANDWICHS_PAR_DEFAUT } from "./persistTypes";

interface GenerateOptions {
  maxLegumesParSandwich?: number;
  vegetarienOnly?: boolean;
  veganLegumes?: boolean; // légumes à la place de la viande
  sansFromage?: boolean;
  sansSauce?: boolean;
  quantites?: QuantitesUtilisation;
  sandwichNames?: string[];
  /** Nombre de sandwichs à générer (combinaisons différentes) */
  count?: number;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Signature unique d'une combinaison (pour déduplication) */
function signature(
  painId: string,
  proteineId: string,
  fromageId: string | null,
  sauceId: string | null,
  legumeIds: string[],
): string {
  return [painId, proteineId, fromageId ?? "", sauceId ?? "", legumeIds.sort().join(",")].join("|");
}

/** Signature d’un sandwich (pour exclure des générations futures) */
export function sandwichSignature(s: Sandwich): string {
  return signature(
    s.pain.id,
    s.proteine.id,
    s.fromage?.id ?? null,
    s.sauce?.id ?? null,
    (s.legumes ?? []).map((l) => l.id),
  );
}

export function genererSandwichs(
  ingredients: Ingredient[],
  options: GenerateOptions = {},
): Sandwich[] {
  const {
    vegetarienOnly = false,
    veganLegumes = false,
    sansFromage = false,
    sansSauce = false,
    quantites = QUANTITES_PAR_DEFAUT,
    maxLegumesParSandwich = 2,
    sandwichNames = NOMS_SANDWICHS_PAR_DEFAUT,
    count = 25,
  } = options;

  const pains = ingredients.filter((i) => i.categorie === "pain");
  const legumes = ingredients.filter((i) => i.categorie === "legumes");
  const fromages = ingredients.filter((i) => i.categorie === "fromage");
  const sauces = ingredients.filter((i) => i.categorie === "sauce");

  let proteines: Ingredient[];
  if (veganLegumes) {
    proteines = legumes.length ? legumes : ingredients.filter((i) => i.categorie === "proteine_vegetarienne");
  } else {
    proteines = ingredients.filter((i) =>
      vegetarienOnly
        ? i.categorie === "proteine_vegetarienne"
        : i.categorie === "viande" || i.categorie === "proteine_vegetarienne",
    );
  }

  if (!pains.length || !proteines.length) return [];

  const needFromage = !sansFromage && fromages.length > 0;
  const needSauce = !sansSauce && sauces.length > 0;
  if (!needFromage && !needSauce) {
    // au moins un des deux pour variété (sauf si vraiment tout optionnel)
  }

  const seen = new Set<string>();
  const sandwiches: Sandwich[] = [];
  const maxAttempts = count * 20;
  let added = 0;
  let attempts = 0;

  const painShuffled = shuffle(pains);
  const proteineShuffled = shuffle(proteines);
  const fromageShuffled = shuffle(fromages);
  const sauceShuffled = shuffle(sauces);
  const legumeShuffled = shuffle(legumes);

  while (added < count && attempts < maxAttempts) {
    attempts++;
    const pain = painShuffled[(added + attempts) % painShuffled.length];
    const prot = proteineShuffled[(added * 7 + attempts) % proteineShuffled.length];
    const from = needFromage ? fromageShuffled[(added * 11 + attempts) % fromageShuffled.length] : null;
    const sauce = needSauce ? sauceShuffled[(added * 13 + attempts) % sauceShuffled.length] : null;

    const numLegumes = Math.min(maxLegumesParSandwich, legumeShuffled.length);
    const selectedLegumes: Ingredient[] = [];
    const usedLegIds = new Set<string>();
    if (veganLegumes && prot.categorie === "legumes") {
      usedLegIds.add(prot.id);
    }
    for (let l = 0; l < numLegumes; l++) {
      const leg = legumeShuffled[(added + l + attempts) % legumeShuffled.length];
      if (leg && !usedLegIds.has(leg.id)) {
        usedLegIds.add(leg.id);
        selectedLegumes.push(leg);
      }
    }

    const sig = signature(
      pain.id,
      prot.id,
      from?.id ?? null,
      sauce?.id ?? null,
      selectedLegumes.map((x) => x.id),
    );
    if (seen.has(sig)) continue;
    seen.add(sig);

    const nameParts = [
      cleanIngredientName(prot.nom),
      from ? cleanIngredientName(from.nom) : null,
      sauce ? cleanIngredientName(sauce.nom) : null,
      ...selectedLegumes.map((l) => cleanIngredientName(l.nom)),
    ].filter(Boolean);
    const nom = `${sandwichNames[added % sandwichNames.length] ?? `Sandwich ${added + 1}`}: ${nameParts.join(" - ")}`;

    const sandwich: Sandwich = {
      id: uuid(),
      nom,
      pain,
      proteine: prot,
      ...(from && { fromage: from }),
      ...(sauce && { sauce }),
      legumes: selectedLegumes.length ? selectedLegumes : undefined,
      cout: 0,
    };
    sandwich.cout = calculerCoutSandwich(sandwich, quantites);
    sandwiches.push(sandwich);
    added++;
  }

  return sandwiches.sort((a, b) => a.cout - b.cout);
}

/** Un menu par sandwich, coût = sandwich + moyenne(boissons) + moyenne(desserts) + emballage */
export function genererMenus(
  sandwiches: Sandwich[],
  ingredients: Ingredient[],
  quantites: QuantitesUtilisation = QUANTITES_PAR_DEFAUT,
): Menu[] {
  const boissons = ingredients.filter((i) => i.categorie === "boisson");
  const desserts = ingredients.filter((i) => i.categorie === "dessert");
  const emballages = ingredients.filter((i) => i.categorie === "emballage");

  const coutEmballage = emballages.reduce(
    (sum, e) => sum + coutPortion(e, quantites.emballage),
    0,
  );

  const placeholderIngredient: Ingredient = {
    id: "moyenne",
    nom: "Moyenne",
    categorie: "boisson",
    prixTotal: 0,
    poidsTotal: 1,
    prixParGramme: 0,
    modeTarif: "unite",
  };
  const firstBoisson = boissons[0] ?? placeholderIngredient;
  const firstDessert = desserts[0] ?? { ...placeholderIngredient, categorie: "dessert" as const };

  return sandwiches.map((s) => {
    const coutBoisson = coutPortion(firstBoisson, quantites.boisson);
    const coutDessert = coutPortion(firstDessert, quantites.dessert);
    const coutTotal = s.cout + coutBoisson + coutDessert + coutEmballage;
    return {
      id: uuid(),
      sandwich: s,
      boisson: firstBoisson,
      dessert: firstDessert,
      emballage: emballages,
      coutEmballage: Number(coutEmballage.toFixed(3)),
      coutTotal: Number(coutTotal.toFixed(3)),
    };
  });
}

