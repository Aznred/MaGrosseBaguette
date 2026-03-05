 "use client";

import Papa from "papaparse";
import { useState } from "react";
import { useIngredientsStore } from "@/store/ingredientsStore";
import type { Ingredient, IngredientCategory } from "@/lib/types";

const CATEGORIES: IngredientCategory[] = [
  "pain",
  "viande",
  "proteine_vegetarienne",
  "fromage",
  "sauce",
  "legumes",
  "boisson",
  "dessert",
  "emballage",
];

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
  if ((CATEGORIES as string[]).includes(c)) return c as IngredientCategory;
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

  // Valeur numérique brute sans unité
  const n = parseFrenchNumber(value);
  return n > 0 ? n : 0;
}

function extractWeightFromName(name: string): number {
  // Exemples couverts: "1kg", "450 g", "75cl", "750ml", "1.5kg"
  return parseWeightToGrams(name);
}

function extractUnitCountFromName(name: string): number {
  const normalized = name.toLowerCase();
  const patterns = [
    /x\s*(\d+)/,
    /lot\s*de\s*(\d+)/,
    /pack\s*de\s*(\d+)/,
    /(\d+)\s*pcs\b/,
    /(\d+)\s*pi[eè]ces?\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const count = Number.parseInt(match[1], 10);
      if (Number.isFinite(count) && count > 0) return count;
    }
  }
  return 1;
}

function parseCsvIngredients(
  csvText: string,
  addIngredients: (items: Ingredient[]) => void,
) {
  Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data;

      const ingredients = rows
        .map((row, idx): Ingredient | null => {
          if (!row.nom) return null;

          const prixTotal = parseFrenchNumber(row.prixTotal ?? row.prix ?? "0");
          const categorie =
            normalizeCategory(row.categorie) ?? inferCategoryFromName(row.nom);

          const modeTarif: Ingredient["modeTarif"] =
            categorie === "boisson" ||
            categorie === "dessert" ||
            categorie === "emballage"
              ? "unite"
              : "gramme";

          const poidsRaw = row.poidsTotal ?? row.poids ?? row.nbUnites ?? "";
          const poidsTotal =
            modeTarif === "unite"
              ? parseFrenchNumber(poidsRaw) || extractUnitCountFromName(String(row.nom)) || 1
              : parseWeightToGrams(poidsRaw) || extractWeightFromName(String(row.nom)) || 1;
          if (!prixTotal || !poidsTotal) return null;

          return {
            id: `ing-${idx}-${row.nom}`,
            nom: String(row.nom),
            categorie,
            prixTotal,
            poidsTotal,
            prixParGramme: prixTotal / poidsTotal,
            modeTarif,
            vegetarien: String(row.vegetarien ?? "").toLowerCase() === "true",
          };
        })
        .filter((v): v is Ingredient => v !== null) as Ingredient[];

      if (ingredients.length) addIngredients(ingredients);
    },
  });
}

function looksLikeCsv(text: string): boolean {
  const firstLine = text.split("\n")[0] ?? "";
  return (
    firstLine.includes(";") ||
    firstLine.includes(",") ||
    firstLine.toLowerCase().includes("nom;") ||
    firstLine.toLowerCase().includes("designation;")
  );
}

function parseHtmlIngredients(
  html: string,
  addIngredients: (items: Ingredient[]) => void,
) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll("tr"));
  const items: Ingredient[] = [];

  rows.forEach((row, idx) => {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length < 2) return;
    const nom = cells[0].textContent?.trim() ?? "";
    if (!nom) return;

    const priceText =
      cells
        .map((c) => c.textContent?.trim() ?? "")
        .find((t) => t.includes("€")) ?? "";
    const priceMatch = priceText.replace(/\s/g, "").replace(",", ".").match(/(\d+(?:\.\d+)?)\s*€/);
    const prixTotal = priceMatch ? parseFrenchNumber(priceMatch[1]) : 0;
    if (!prixTotal) return;

    const unitsCount = extractUnitCountFromName(nom) || 1;

    items.push({
      id: `html-${idx}-${nom}`,
      nom,
      categorie: inferCategoryFromName(nom),
      prixTotal,
      poidsTotal: unitsCount,
      prixParGramme: prixTotal / unitsCount,
      modeTarif: "unite",
    });
  });

  if (items.length) addIngredients(items);
}

export function MetroImport() {
  const addIngredients = useIngredientsStore((s) => s.addIngredients);
  const [url, setUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    const text = await file.text();
    if (looksLikeCsv(text)) {
      parseCsvIngredients(text, addIngredients);
      return;
    }

    parseHtmlIngredients(text, addIngredients);
    if (!text.trim()) {
      setError(
        "Ce fichier ne ressemble pas à un CSV ou à une page HTML METRO exploitable automatiquement.",
      );
    }
  };

  const handleImportUrl = async () => {
    if (!url) return;
    setError(null);
    setLoadingUrl(true);
    try {
      const res = await fetch(`/api/import-metro?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'import METRO");
        return;
      }

      const content = typeof data.content === "string" ? data.content : "";
      if (!content) {
        setError("Réponse vide depuis l'URL METRO");
        return;
      }

      if (looksLikeCsv(content)) {
        parseCsvIngredients(content, addIngredients);
      } else {
        parseHtmlIngredients(content, addIngredients);
      }
    } catch {
      setError("Impossible de récupérer la liste METRO");
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <div className="space-y-5 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-stone-900">
            Importer une liste METRO
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Collez l&apos;URL de votre liste METRO ou importez un fichier HTML/CSV.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-stone-800">
          Importer un fichier (HTML ou CSV)
          <input
            type="file"
            accept="text/html,.html,.htm,.csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </label>
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center text-sm transition ${
          isDragging
            ? "border-emerald-400 bg-emerald-50/80 text-emerald-700"
            : "border-stone-200 bg-stone-50/50 text-stone-500"
        }`}
      >
        Glisse-dépose ton fichier ici (HTML/CSV)
      </div>

      <div className="space-y-2 rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4">
        <label className="text-sm font-medium text-stone-700">
          URL METRO (page de liste ou export)
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            onClick={handleImportUrl}
            disabled={!url || loadingUrl}
            className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingUrl ? "Import…" : "Importer URL"}
          </button>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}


