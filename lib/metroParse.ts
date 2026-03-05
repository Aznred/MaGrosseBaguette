import Papa from "papaparse";
import type { Ingredient, IngredientCategory } from "./types";

type CsvRow = Record<string, string | undefined>;

function normalizeCategory(raw?: string): IngredientCategory | null {
  if (!raw) return null;
  const c = raw.toLowerCase().trim();
  if (c.includes("pain")) return "pain";
  if (c.includes("viande") || c.includes("charcut")) return "viande";
  if (c.includes("vegetar") || c.includes("végétar")) return "proteine_vegetarienne";
  if (c.includes("fromage") || c.includes("crèmer") || c.includes("cremer")) return "fromage";
  if (c.includes("sauce")) return "sauce";
  if (c.includes("légume") || c.includes("legume") || c.includes("fruit")) return "legumes";
  if (c.includes("boisson")) return "boisson";
  if (c.includes("dessert") || c.includes("sucr")) return "dessert";
  if (c.includes("emballage") || c.includes("jetable")) return "emballage";
  const categories: IngredientCategory[] = [
    "pain", "viande", "proteine_vegetarienne", "fromage", "sauce",
    "legumes", "boisson", "dessert", "emballage",
  ];
  if (categories.includes(c as IngredientCategory)) return c as IngredientCategory;
  return null;
}

function inferCategoryFromName(name: string): IngredientCategory {
  const n = name.toLowerCase();
  if (/(baguette|pain|bun|focaccia)/.test(n)) return "pain";
  if (/(jambon|poulet|dinde|boeuf|steak|thon|lardon|viande)/.test(n)) return "viande";
  if (/(tofu|veggie|vegetal|végétal|falafel|seitan)/.test(n)) return "proteine_vegetarienne";
  if (/(emmental|mozzarella|comte|comté|fromage|cheddar|brie)/.test(n)) return "fromage";
  if (/(sauce|mayo|mayonnaise|ketchup|pesto|barbecue|harissa)/.test(n)) return "sauce";
  if (/(tomate|salade|roquette|cornichon|oignon|legume|légume)/.test(n)) return "legumes";
  if (/(cola|eau|jus|boisson|ice tea|thé|soda)/.test(n)) return "boisson";
  if (/(dessert|cookie|brownie|yaourt|mousse|gateau|gâteau)/.test(n)) return "dessert";
  if (/(sac|emballage|papier|serviette|barquette)/.test(n)) return "emballage";
  return "emballage";
}

function parseFrenchNumber(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function parseWeightToGrams(rawValue?: string): number {
  if (!rawValue) return 0;
  const value = rawValue.toLowerCase().replace(",", ".").trim();
  const kg = value.match(/(\d+(?:\.\d+)?)\s*kg\b/);
  if (kg) return parseFrenchNumber(kg[1]) * 1000;
  const g = value.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (g) return parseFrenchNumber(g[1]);
  const litre = value.match(/(\d+(?:\.\d+)?)\s*l\b/);
  if (litre) return parseFrenchNumber(litre[1]) * 1000;
  const cl = value.match(/(\d+(?:\.\d+)?)\s*cl\b/);
  if (cl) return parseFrenchNumber(cl[1]) * 10;
  const ml = value.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (ml) return parseFrenchNumber(ml[1]);
  const n = parseFrenchNumber(value);
  return n > 0 ? n : 0;
}

function extractUnitCountFromName(name: string): number {
  const normalized = name.toLowerCase();
  const patterns = [/x\s*(\d+)/, /lot\s*de\s*(\d+)/, /pack\s*de\s*(\d+)/, /(\d+)\s*pcs\b/, /(\d+)\s*pi[eè]ces?\b/];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const count = Number.parseInt(match[1], 10);
      if (Number.isFinite(count) && count > 0) return count;
    }
  }
  return 1;
}

export function looksLikeCsv(text: string): boolean {
  const firstLine = text.split("\n")[0] ?? "";
  return (
    firstLine.includes(";") ||
    firstLine.includes(",") ||
    firstLine.toLowerCase().includes("nom;") ||
    firstLine.toLowerCase().includes("designation;")
  );
}

export function parseCsvToIngredients(csvText: string): Promise<Ingredient[]> {
  return new Promise((resolve) => {
    Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const ingredients = rows
          .map((row, idx): Ingredient | null => {
            if (!row.nom) return null;
            const prixTotal = parseFrenchNumber(row.prixTotal ?? row.prix ?? "0");
            const categorie = normalizeCategory(row.categorie) ?? inferCategoryFromName(row.nom);
            const modeTarif: Ingredient["modeTarif"] =
              categorie === "boisson" || categorie === "dessert" || categorie === "emballage" ? "unite" : "gramme";
            const poidsRaw = row.poidsTotal ?? row.poids ?? row.nbUnites ?? "";
            const poidsTotal =
              modeTarif === "unite"
                ? parseFrenchNumber(poidsRaw) || extractUnitCountFromName(String(row.nom)) || 1
                : parseWeightToGrams(poidsRaw) || parseWeightToGrams(String(row.nom)) || 1;
            if (!prixTotal || !poidsTotal) return null;
            return {
              id: `metro-${idx}-${Date.now()}`,
              nom: String(row.nom),
              categorie,
              prixTotal,
              poidsTotal,
              prixParGramme: prixTotal / poidsTotal,
              modeTarif,
              vegetarien: String(row.vegetarien ?? "").toLowerCase() === "true",
            };
          })
          .filter((v): v is Ingredient => v !== null);
        resolve(ingredients);
      },
    });
  });
}

export function parseHtmlToIngredients(html: string): Ingredient[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll("tr"));
  const items: Ingredient[] = [];
  rows.forEach((row, idx) => {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length < 2) return;
    const nom = cells[0].textContent?.trim() ?? "";
    if (!nom) return;
    const priceText = cells.map((c) => c.textContent?.trim() ?? "").find((t) => t.includes("€")) ?? "";
    const priceMatch = priceText.replace(/\s/g, "").replace(",", ".").match(/(\d+(?:\.\d+)?)\s*€/);
    const prixTotal = priceMatch ? parseFrenchNumber(priceMatch[1]) : 0;
    if (!prixTotal) return;
    const unitsCount = extractUnitCountFromName(nom) || 1;
    items.push({
      id: `metro-html-${idx}-${Date.now()}`,
      nom,
      categorie: inferCategoryFromName(nom),
      prixTotal,
      poidsTotal: unitsCount,
      prixParGramme: prixTotal / unitsCount,
      modeTarif: "unite",
    });
  });
  return items;
}

export async function parseMetroContentToIngredients(content: string): Promise<Ingredient[]> {
  if (looksLikeCsv(content)) return parseCsvToIngredients(content);
  return parseHtmlToIngredients(content);
}
