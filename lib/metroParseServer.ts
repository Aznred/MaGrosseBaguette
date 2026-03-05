import * as cheerio from "cheerio";
import type { Ingredient, IngredientCategory } from "./types";
import {
  looksLikeCsv,
  parseCsvToIngredients,
  inferCategoryFromName,
  parseFrenchNumber,
  extractUnitCountFromName,
} from "./metroParse";

/** Parse HTML (côté serveur Node) en utilisant cheerio. */
export function parseHtmlToIngredientsServer(html: string): Ingredient[] {
  const $ = cheerio.load(html);
  const items: Ingredient[] = [];
  $("tr").each((idx, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;
    const nom = $(cells[0]).text().trim();
    if (!nom) return;
    let prixTotal = 0;
    cells.each((_, cell) => {
      const text = $(cell).text().trim();
      if (text.includes("€")) {
        const priceMatch = text.replace(/\s/g, "").replace(",", ".").match(/(\d+(?:\.\d+)?)\s*€/);
        if (priceMatch) prixTotal = parseFrenchNumber(priceMatch[1]);
      }
    });
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

/** Parse contenu Metro (CSV ou HTML) côté serveur. */
export async function parseMetroContentToIngredientsServer(content: string): Promise<Ingredient[]> {
  if (looksLikeCsv(content)) return parseCsvToIngredients(content);
  return parseHtmlToIngredientsServer(content);
}
