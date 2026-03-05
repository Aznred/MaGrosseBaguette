import type { NameStat, TopMenuCombo, ProductionRecommendation, MenuRentability } from "./types/analytics";
import type { ShoppingListLine } from "./shoppingFromProduction";

function escapeCsv(s: string): string {
  return `"${String(s).replace(/"/g, '""')}"`;
}

export function exportAnalyticsReportCsv(
  sandwichStats: NameStat[],
  drinkStats: NameStat[],
  dessertStats: NameStat[],
  topMenus: TopMenuCombo[],
  recommendation: ProductionRecommendation,
  rentability: MenuRentability[],
  totalOrders: number,
  costMoyen: number,
  shoppingList: ShoppingListLine[] = []
): void {
  const rows: string[][] = [
    ["Rapport Analyste - Ma Verge"],
    ["Généré le", new Date().toLocaleString("fr-FR")],
    [],
    ["Total commandes enregistrées", String(totalOrders)],
    ["Coût moyen menu (€)", costMoyen.toFixed(2)],
    [],
    ["Sandwichs populaires", "Quantité"],
    ...sandwichStats.map((s) => [s.name, String(s.count)]),
    [],
    ["Boissons populaires", "Quantité"],
    ...drinkStats.map((b) => [b.name, String(b.count)]),
    [],
    ["Desserts populaires", "Quantité"],
    ...dessertStats.map((d) => [d.name, String(d.count)]),
    [],
    ["Top menus (sandwich + boisson + dessert)", "Quantité"],
    ...topMenus.map((t) => [t.label, String(t.count)]),
    [],
    ["Recommandation production - Sandwichs", "Quantité"],
    ...recommendation.sandwiches.map((s) => [s.name, String(s.quantity)]),
    [],
    ["Recommandation production - Boissons", "Quantité"],
    ...recommendation.boissons.map((b) => [b.name, String(b.quantity)]),
    [],
    ["Recommandation production - Desserts", "Quantité"],
    ...recommendation.desserts.map((d) => [d.name, String(d.quantity)]),
    [],
    ["Liste de courses", "Quantité", "Unité"],
    ...shoppingList.map((l) => [l.ingredientName, String(l.quantity), l.unit === "g" ? "g" : "unité(s)"]),
    [],
    ["Menus les plus rentables (marge estimée €)", "Marge"],
    ...rentability.slice(0, 20).map((r) => [r.label, `${r.margeEstimee.toFixed(2)} €`]),
  ];
  const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-analyste-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printAnalyticsReportPdf(
  sandwichStats: NameStat[],
  drinkStats: NameStat[],
  dessertStats: NameStat[],
  topMenus: TopMenuCombo[],
  recommendation: ProductionRecommendation,
  rentability: MenuRentability[],
  totalOrders: number,
  costMoyen: number,
  shoppingList: ShoppingListLine[] = []
): void {
  function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  const section = (title: string, lines: string[]) =>
    `<h2>${escapeHtml(title)}</h2><ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`;
  const topMenusHtml = topMenus.slice(0, 15).map((t) => `${t.label} → ${t.count}`);
  const recSand = recommendation.sandwiches.map((s) => `${s.name} → ${s.quantity}`);
  const recBoisson = recommendation.boissons.map((b) => `${b.name} → ${b.quantity}`);
  const recDessert = recommendation.desserts.map((d) => `${d.name} → ${d.quantity}`);
  const shoppingLines = shoppingList.map((l) => `${l.ingredientName} → ${l.quantity} ${l.unit === "g" ? "g" : "u"}`);
  const rentHtml = rentability.slice(0, 10).map((r) => `${r.label} → marge ${r.margeEstimee} €`);
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport Analyste</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; max-width: 640px; margin: 0 auto; }
          h1 { font-size: 1.25rem; margin-bottom: 8px; }
          h2 { font-size: 1rem; margin-top: 20px; margin-bottom: 8px; }
          ul { margin: 0 0 12px 0; padding-left: 20px; }
          .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h1>Rapport Analyste - Ma Verge</h1>
        <p class="meta">Généré le ${new Date().toLocaleString("fr-FR")}</p>
        <p><strong>Total commandes :</strong> ${totalOrders} · <strong>Coût moyen menu :</strong> ${costMoyen.toFixed(2)} €</p>
        ${section("Sandwichs populaires", sandwichStats.slice(0, 10).map((s) => `${s.name} → ${s.count}`))}
        ${section("Boissons populaires", drinkStats.slice(0, 8).map((b) => `${b.name} → ${b.count}`))}
        ${section("Desserts populaires", dessertStats.slice(0, 8).map((d) => `${d.name} → ${d.count}`))}
        ${section("Top menus", topMenusHtml)}
        ${section("Recommandation production - Sandwichs", recSand.slice(0, 10))}
        ${section("Recommandation production - Boissons", recBoisson.slice(0, 8))}
        ${section("Recommandation production - Desserts", recDessert.slice(0, 8))}
        ${shoppingLines.length ? section("Liste de courses", shoppingLines) : ""}
        ${section("Menus les plus rentables", rentHtml)}
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(content);
  w.document.close();
}
