/**
 * Scraper des produits alimentaires Metro (shop.metro.fr).
 * Remplit data/metro-products.json pour la recherche dans l'onglet Ingrédients.
 *
 * Usage: node scripts/scrape-metro.mjs
 * (Depuis la racine du projet, avec PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=0 si besoin)
 */

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const OUT_FILE = path.join(DATA_DIR, "metro-products.json");

const CATEGORIES_ALIMENTAIRES = [
  "https://shop.metro.fr/shop/category/alimentaire/boucherie",
  "https://shop.metro.fr/shop/category/alimentaire/crèmerie",
  "https://shop.metro.fr/shop/category/alimentaire/fruits-et-légumes",
  "https://shop.metro.fr/shop/category/alimentaire/epicerie-salée",
  "https://shop.metro.fr/shop/category/alimentaire/surgelé",
];

function inferCategory(nom) {
  const n = (nom || "").toLowerCase();
  if (/(baguette|pain|bun|focaccia)/.test(n)) return "pain";
  if (/(jambon|poulet|dinde|boeuf|steak|thon|lardon|viande)/.test(n)) return "viande";
  if (/(tofu|veggie|vegetal|végétal|falafel|seitan)/.test(n)) return "proteine_vegetarienne";
  if (/(emmental|mozzarella|comte|comté|fromage|cheddar|brie)/.test(n)) return "fromage";
  if (/(sauce|mayo|mayonnaise|ketchup|pesto|barbecue|harissa)/.test(n)) return "sauce";
  if (/(tomate|salade|roquette|cornichon|oignon|legume|légume|fruit)/.test(n)) return "legumes";
  if (/(cola|eau|jus|boisson|ice tea|thé|soda)/.test(n)) return "boisson";
  if (/(dessert|cookie|brownie|yaourt|mousse|gateau|gâteau)/.test(n)) return "dessert";
  if (/(sac|emballage|papier|serviette|barquette)/.test(n)) return "emballage";
  return "emballage";
}

function parsePrice(text) {
  if (!text) return 0;
  const m = String(text).replace(/\s/g, "").replace(",", ".").match(/(\d+(?:\.\d+)?)\s*€/);
  return m ? parseFloat(m[1]) : 0;
}

async function run() {
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    console.error("Puppeteer non installé. Lancez: npm install puppeteer --save-dev");
    process.exit(1);
  }

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const products = [];
  const seen = new Set();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    for (const url of CATEGORIES_ALIMENTAIRES) {
      console.log("Scraping:", url);
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        await page.waitForTimeout(2000);

        const items = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="/shop/pv/"], a[href*="/pv/"]'));
          return links.map((a) => {
            const name = (a.textContent || "").trim();
            const href = a.getAttribute("href") || "";
            let price = 0;
            const priceEl = a.closest("article")?.querySelector("[class*='price'], [data-price]") || a.querySelector("[class*='price']");
            if (priceEl) {
              const match = (priceEl.textContent || "").match(/(\d+(?:[.,]\d+)?)\s*€/);
              if (match) price = parseFloat(match[1].replace(",", "."));
            }
            return { name, href, price };
          }).filter((x) => x.name && x.name.length > 2);
        });

        for (const { name, price } of items) {
          const key = name.toLowerCase().trim();
          if (seen.has(key)) continue;
          seen.add(key);
          const poidsTotal = price > 0 ? 1 : 1;
          products.push({
            id: `metro-db-${products.length}-${Date.now()}`,
            nom: name.trim(),
            categorie: inferCategory(name),
            prixTotal: price || 0,
            poidsTotal,
            prixParGramme: price || 0,
            modeTarif: "unite",
          });
        }
      } catch (e) {
        console.warn("Erreur page", url, e.message);
      }
    }

    await browser.close();
  } catch (e) {
    await browser.close();
    console.error(e);
    process.exit(1);
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(products, null, 2), "utf-8");
  console.log("Écrit", products.length, "produits dans", OUT_FILE);
}

run();
