import * as XLSX from "xlsx";
import type { Ingredient, Menu, Sandwich } from "./types";
import type { QuantitesUtilisation } from "./pricing";
import { coutPortion } from "./pricing";
import { cleanIngredientName } from "./ingredientName";

/** Prix de vente à l'unité = coût × 2 arrondi à 0,10 € (ex: 0,53×2=1,06→1,10 ; 0,49×2=0,98→1,00) */
export function prixVenteUnitaire(coutUnitaire: number): number {
  return Math.round(coutUnitaire * 2 * 10) / 10;
}

const COUT_PAIN_FIXE = 0.5;
const PRIX_VENTE_MENU = 5;

function rowMenu(
  m: Menu,
  q: QuantitesUtilisation,
): Record<string, string | number> {
  const s = m.sandwich;
  const coutProteine = coutPortion(s.proteine, q.proteine);
  const coutFromage = s.fromage ? coutPortion(s.fromage, q.fromage) : 0;
  const coutSauce = s.sauce ? coutPortion(s.sauce, q.sauce) : 0;
  const coutLegumes = (s.legumes ?? []).reduce(
    (sum, leg) => sum + coutPortion(leg, q.legumes),
    0,
  );
  const coutBoisson = coutPortion(m.boisson, q.boisson);
  const coutDessert = coutPortion(m.dessert, q.dessert);
  const totalVerif =
    s.cout + Number(coutBoisson.toFixed(3)) + Number(coutDessert.toFixed(3)) + m.coutEmballage;

  const ingredientsList = [
    cleanIngredientName(s.pain.nom),
    cleanIngredientName(s.proteine.nom),
    ...(s.fromage ? [cleanIngredientName(s.fromage.nom)] : []),
    ...(s.sauce ? [cleanIngredientName(s.sauce.nom)] : []),
    ...(s.legumes?.map((l) => cleanIngredientName(l.nom)) ?? []),
  ].join(" · ");

  return {
    "Nom sandwich": s.nom,
    Ingrédients: ingredientsList,
    "Coût pain (€)": COUT_PAIN_FIXE,
    "Coût protéine (€)": Number(coutProteine.toFixed(3)),
    "Coût fromage (€)": Number(coutFromage.toFixed(3)),
    "Coût sauce (€)": Number(coutSauce.toFixed(3)),
    "Coût légumes (€)": Number(coutLegumes.toFixed(3)),
    "Coût sandwich (€)": s.cout,
    Boisson: cleanIngredientName(m.boisson.nom),
    "Coût boisson (€)": Number(coutBoisson.toFixed(3)),
    Dessert: cleanIngredientName(m.dessert.nom),
    "Coût dessert (€)": Number(coutDessert.toFixed(3)),
    "Coût emballage (€)": m.coutEmballage,
    "Coût total menu (€)": m.coutTotal,
    "Total (sandwich+boisson+dessert+emballage) (€)": Number(totalVerif.toFixed(3)),
    "Bénéfice si vendu à 5€ (€)": Number((PRIX_VENTE_MENU - m.coutTotal).toFixed(3)),
  };
}

function rowSandwich(s: Sandwich, q: QuantitesUtilisation): Record<string, string | number> {
  const coutProteine = coutPortion(s.proteine, q.proteine);
  const coutFromage = s.fromage ? coutPortion(s.fromage, q.fromage) : 0;
  const coutSauce = s.sauce ? coutPortion(s.sauce, q.sauce) : 0;
  const coutLegumes = (s.legumes ?? []).reduce(
    (sum, leg) => sum + coutPortion(leg, q.legumes),
    0,
  );
  const ingredientsList = [
    cleanIngredientName(s.pain.nom),
    cleanIngredientName(s.proteine.nom),
    ...(s.fromage ? [cleanIngredientName(s.fromage.nom)] : []),
    ...(s.sauce ? [cleanIngredientName(s.sauce.nom)] : []),
    ...(s.legumes?.map((l) => cleanIngredientName(l.nom)) ?? []),
  ].join(" · ");

  return {
    "Nom sandwich": s.nom,
    Ingrédients: ingredientsList,
    "Coût pain (€)": COUT_PAIN_FIXE,
    "Coût protéine (€)": Number(coutProteine.toFixed(3)),
    "Coût fromage (€)": Number(coutFromage.toFixed(3)),
    "Coût sauce (€)": Number(coutSauce.toFixed(3)),
    "Coût légumes (€)": Number(coutLegumes.toFixed(3)),
    "Coût sandwich (€)": s.cout,
  };
}

export function exportMenusToExcel(
  menus: Menu[],
  quantites: QuantitesUtilisation,
  sandwichesUniques?: Sandwich[],
) {
  const wsMenus = XLSX.utils.json_to_sheet(
    menus.map((m) => rowMenu(m, quantites)),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMenus, "Menus");

  if (sandwichesUniques?.length) {
    const wsSandwiches = XLSX.utils.json_to_sheet(
      sandwichesUniques.map((s) => rowSandwich(s, quantites)),
    );
    XLSX.utils.book_append_sheet(wb, wsSandwiches, "Sandwichs");
  }

  XLSX.writeFile(wb, "planificateur-menus.xlsx");
}

export interface ComptaExportData {
  menus: Menu[];
  sandwiches: Sandwich[];
  ingredients: Ingredient[];
  quantites: QuantitesUtilisation;
  ventesParNomSandwich: Record<string, number>;
  ventesBoissons: Record<string, number>;
  ventesSnacks: Record<string, number>;
}

export function exportComptaToExcel(data: ComptaExportData): void {
  const {
    menus,
    sandwiches,
    ingredients,
    quantites,
    ventesParNomSandwich,
    ventesBoissons,
    ventesSnacks,
  } = data;

  const nomsSandwichsUniques = Array.from(
    new Set(sandwiches.map((s) => s.nom)),
  );
  const getCoutMenu = (nom: string) =>
    menus.find((m) => m.sandwich.nom === nom)?.coutTotal ?? 0;

  const rowsMenus = nomsSandwichsUniques
    .filter((nom) => (ventesParNomSandwich[nom] ?? 0) > 0)
    .map((nom) => {
      const qte = ventesParNomSandwich[nom] ?? 0;
      const coutUnit = getCoutMenu(nom);
      const ca = qte * PRIX_VENTE_MENU;
      const coutTotal = qte * coutUnit;
      return {
        "Nom sandwich": nom,
        "Quantité vendue": qte,
        "Coût unitaire menu (€)": Number(coutUnit.toFixed(3)),
        "Prix vente (€)": PRIX_VENTE_MENU,
        "CA (€)": Number(ca.toFixed(2)),
        "Coût total (€)": Number(coutTotal.toFixed(2)),
        "Bénéfice (€)": Number((ca - coutTotal).toFixed(2)),
      };
    });

  const boissons = ingredients.filter((i) => i.categorie === "boisson");
  const snacks = ingredients.filter((i) => i.categorie === "dessert");
  const rowsUnite: Record<string, string | number>[] = [];
  boissons.forEach((ing) => {
    const qte = ventesBoissons[ing.nom] ?? 0;
    if (qte === 0) return;
    const coutUnit = coutPortion(ing, quantites.boisson);
    const prixVente = prixVenteUnitaire(coutUnit);
    rowsUnite.push({
      Type: "Boisson",
      Nom: cleanIngredientName(ing.nom),
      "Coût unitaire (€)": Number(coutUnit.toFixed(3)),
      "Prix vente (€)": prixVente,
      "Quantité vendue": qte,
      "CA (€)": Number((qte * prixVente).toFixed(2)),
      "Coût total (€)": Number((qte * coutUnit).toFixed(2)),
      "Bénéfice (€)": Number(
        (qte * prixVente - qte * coutUnit).toFixed(2),
      ),
    });
  });
  snacks.forEach((ing) => {
    const qte = ventesSnacks[ing.nom] ?? 0;
    if (qte === 0) return;
    const coutUnit = coutPortion(ing, quantites.dessert);
    const prixVente = prixVenteUnitaire(coutUnit);
    rowsUnite.push({
      Type: "Snack / Dessert",
      Nom: cleanIngredientName(ing.nom),
      "Coût unitaire (€)": Number(coutUnit.toFixed(3)),
      "Prix vente (€)": prixVente,
      "Quantité vendue": qte,
      "CA (€)": Number((qte * prixVente).toFixed(2)),
      "Coût total (€)": Number((qte * coutUnit).toFixed(2)),
      "Bénéfice (€)": Number(
        (qte * prixVente - qte * coutUnit).toFixed(2),
      ),
    });
  });

  const caMenus = nomsSandwichsUniques.reduce(
    (acc, nom) => acc + (ventesParNomSandwich[nom] ?? 0) * PRIX_VENTE_MENU,
    0,
  );
  const coutMenus = nomsSandwichsUniques.reduce(
    (acc, nom) =>
      acc + (ventesParNomSandwich[nom] ?? 0) * getCoutMenu(nom),
    0,
  );
  let caBoissons = 0;
  let coutBoissons = 0;
  boissons.forEach((ing) => {
    const qte = ventesBoissons[ing.nom] ?? 0;
    const coutUnit = coutPortion(ing, quantites.boisson);
    caBoissons += qte * prixVenteUnitaire(coutUnit);
    coutBoissons += qte * coutUnit;
  });
  let caSnacks = 0;
  let coutSnacks = 0;
  snacks.forEach((ing) => {
    const qte = ventesSnacks[ing.nom] ?? 0;
    const coutUnit = coutPortion(ing, quantites.dessert);
    caSnacks += qte * prixVenteUnitaire(coutUnit);
    coutSnacks += qte * coutUnit;
  });
  const totalCA = caMenus + caBoissons + caSnacks;
  const totalCout = coutMenus + coutBoissons + coutSnacks;
  const benefice = totalCA - totalCout;

  const wsMenus = XLSX.utils.json_to_sheet(
    rowsMenus.length ? rowsMenus : [{ "Nom sandwich": "(aucune vente)" }],
  );
  const wsUnite = XLSX.utils.json_to_sheet(
    rowsUnite.length ? rowsUnite : [{ Type: "(aucune vente à l'unité)" }],
  );
  const wsSynthèse = XLSX.utils.json_to_sheet([
    { Libellé: "CA Menus (5€/menu)", "Montant (€)": Number(caMenus.toFixed(2)) },
    { Libellé: "CA Boissons (×2 arrondi)", "Montant (€)": Number(caBoissons.toFixed(2)) },
    { Libellé: "CA Snacks / Desserts (×2 arrondi)", "Montant (€)": Number(caSnacks.toFixed(2)) },
    { Libellé: "Total CA", "Montant (€)": Number(totalCA.toFixed(2)) },
    { Libellé: "Total coûts", "Montant (€)": Number(totalCout.toFixed(2)) },
    { Libellé: "Bénéfice", "Montant (€)": Number(benefice.toFixed(2)) },
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSynthèse, "Synthèse");
  XLSX.utils.book_append_sheet(wb, wsMenus, "Ventes menus");
  XLSX.utils.book_append_sheet(wb, wsUnite, "Ventes à l'unité");
  XLSX.writeFile(wb, "comptabilité.xlsx");
}
