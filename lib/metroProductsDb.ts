import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Ingredient } from "./types";
import { METRO_DEFAULT_CATALOG } from "./metroDefaultCatalog";

const DATA_DIR = path.join(process.cwd(), "data");
const METRO_PRODUCTS_FILE = path.join(DATA_DIR, "metro-products.json");

export type MetroProductRecord = Ingredient & { sourceUrl?: string };

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function readMetroProducts(): Promise<MetroProductRecord[]> {
  try {
    const raw = await readFile(METRO_PRODUCTS_FILE, "utf-8");
    const data = JSON.parse(raw);
    const products = Array.isArray(data) ? data : [];
    return products.length > 0 ? products : METRO_DEFAULT_CATALOG;
  } catch {
    return METRO_DEFAULT_CATALOG;
  }
}

export async function writeMetroProducts(products: MetroProductRecord[]): Promise<void> {
  await ensureDataDir();
  await writeFile(
    METRO_PRODUCTS_FILE,
    JSON.stringify(products, null, 2),
    "utf-8"
  );
}

/** Recherche par nom (insensible à la casse, sous-chaîne). */
export async function searchMetroProducts(query: string, limit = 50): Promise<MetroProductRecord[]> {
  const all = await readMetroProducts();
  if (!query.trim()) return all.slice(0, limit);
  const q = query.toLowerCase().trim();
  return all
    .filter((p) => p.nom.toLowerCase().includes(q))
    .slice(0, limit);
}

/** Remplace toute la base par les ingrédients fournis (ids régénérés pour cohérence). */
export async function seedMetroProducts(
  ingredients: Ingredient[],
  sourceUrl?: string
): Promise<number> {
  const records: MetroProductRecord[] = ingredients.map((ing, idx) => ({
    ...ing,
    id: `metro-db-${idx}-${Date.now()}`,
    sourceUrl,
  }));
  await writeMetroProducts(records);
  return records.length;
}
