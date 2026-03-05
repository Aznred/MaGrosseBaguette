import type { ShoppingItem } from "@/lib/types/shopping";

/** Exporte la liste à acheter (toBuy > 0) en CSV */
export function exportShoppingListToCsv(items: ShoppingItem[], totalEstimated: number): void {
  const rows = [
    ["Ingrédient", "Quantité à acheter", "Unité", "Prix estimé (€)"],
    ...items
      .filter((i) => i.toBuy > 0)
      .map((i) => [
        i.ingredientName,
        String(i.toBuy),
        i.unit === "g" ? "g" : "unité(s)",
        i.priceEstimated.toFixed(2),
      ]),
    [],
    ["Total estimé (€)", totalEstimated.toFixed(2)],
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `liste-courses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Ouvre une fenêtre d'impression pour sauvegarder en PDF (liste à acheter + total) */
export function printShoppingListForPdf(items: ShoppingItem[], totalEstimated: number): void {
  const toBuy = items.filter((i) => i.toBuy > 0);
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Liste de courses</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; }
          h1 { font-size: 1.25rem; margin-bottom: 16px; }
          ul { list-style: none; padding: 0; margin: 0; }
          li { padding: 6px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; gap: 12px; }
          .total { margin-top: 16px; font-weight: 700; font-size: 1.1rem; }
        </style>
      </head>
      <body>
        <h1>Liste de courses</h1>
        <ul>
          ${toBuy
            .map(
              (i) =>
                `<li><span>${escapeHtml(i.ingredientName)}</span><span>${formatQty(i.toBuy, i.unit)} · ${i.priceEstimated.toFixed(2)} €</span></li>`
            )
            .join("")}
        </ul>
        <p class="total">Total estimé : ${totalEstimated.toFixed(2)} €</p>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(content);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatQty(n: number, unit: "g" | "u"): string {
  return unit === "g" ? `${n} g` : `${n} unité(s)`;
}
