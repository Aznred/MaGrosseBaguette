"use client";

import { useCallback, useEffect, useState } from "react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useIngredientsStore } from "@/store/ingredientsStore";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { exportShoppingListToCsv, printShoppingListForPdf } from "@/lib/shoppingExport";
import type { ShoppingItem } from "@/lib/types/shopping";

const HELLOASSO_STORAGE_KEY = "helloasso-config";

function formatQty(n: number, unit: "g" | "u"): string {
  return unit === "g" ? `${n} g` : `${n} unité(s)`;
}

function ShoppingTable({
  items,
  setStock,
}: {
  items: ShoppingItem[];
  setStock: (ingredientId: string, stock: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 font-semibold text-slate-700">Ingrédient</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Quantité nécessaire</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Déjà en stock</th>
            <th className="px-4 py-3 font-semibold text-slate-700">À acheter</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Prix estimé</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.ingredientId} className="border-b border-slate-100">
              <td className="px-4 py-2.5 font-medium text-slate-900">{item.ingredientName}</td>
              <td className="px-4 py-2.5 text-slate-600">{formatQty(item.quantityNeeded, item.unit)}</td>
              <td className="px-4 py-2.5">
                <input
                  type="number"
                  min={0}
                  step={item.unit === "g" ? 10 : 1}
                  value={item.stock}
                  onChange={(e) => setStock(item.ingredientId, parseFloat(e.target.value) || 0)}
                  className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </td>
              <td className="px-4 py-2.5 font-medium text-slate-800">
                {item.toBuy > 0 ? formatQty(item.toBuy, item.unit) : "—"}
              </td>
              <td className="px-4 py-2.5 text-emerald-700">
                {item.priceEstimated > 0 ? `${item.priceEstimated.toFixed(2)} €` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ShoppingListPage() {
  const {
    selections,
    items,
    totalEstimated,
    setSelectionCount,
    setStock,
    generateShoppingList,
    addSelection,
    removeSelection,
    loadFromOrders,
    sandwiches,
  } = useShoppingList();
  const { ingredients } = useIngredientsStore();
  const { addMenuOrders } = useAnalyticsStore();

  const [helloAssoUrl, setHelloAssoUrl] = useState("");
  const [helloAssoToken, setHelloAssoToken] = useState("");
  const [helloAssoLoading, setHelloAssoLoading] = useState(false);
  const [helloAssoError, setHelloAssoError] = useState<string | null>(null);
  const [helloAssoSuccess, setHelloAssoSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HELLOASSO_STORAGE_KEY);
      if (raw) {
        const { apiUrl = "", accessToken = "" } = JSON.parse(raw);
        setHelloAssoUrl(apiUrl);
        setHelloAssoToken(accessToken);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHelloAssoConfig = useCallback(() => {
    localStorage.setItem(
      HELLOASSO_STORAGE_KEY,
      JSON.stringify({ apiUrl: helloAssoUrl.trim(), accessToken: helloAssoToken.trim() })
    );
  }, [helloAssoUrl, helloAssoToken]);

  const fetchHelloAssoAndFillList = useCallback(async () => {
    setHelloAssoError(null);
    setHelloAssoSuccess(null);
    const apiUrl = helloAssoUrl.trim() || undefined;
    if (!apiUrl) {
      setHelloAssoError("Indiquez le lien (URL) de l’API HelloAsso.");
      return;
    }
    setHelloAssoLoading(true);
    try {
      const sandwichNames = sandwiches.map((s) => s.nom);
      const drinks = ingredients.filter((i) => i.categorie === "boisson");
      const desserts = ingredients.filter((i) => i.categorie === "dessert");
      const defaultBoisson = drinks[0]?.nom ?? "";
      const defaultDessert = desserts[0]?.nom ?? "";

      const res = await fetch("/api/helloasso/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl,
          accessToken: helloAssoToken.trim() || undefined,
          sandwichNames,
          defaultBoisson,
          defaultDessert,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setHelloAssoError(data.error ?? `Erreur ${res.status}`);
        return;
      }

      const orders = data.orders ?? [];
      if (orders.length === 0) {
        setHelloAssoError("Aucun sandwich reconnu dans les ventes. Vérifiez les noms de produits côté HelloAsso.");
        return;
      }

      loadFromOrders(orders);
      addMenuOrders(orders);
      const total = data.total ?? orders.reduce((s: number, o: { quantity?: number }) => s + (o.quantity ?? 1), 0);
      setHelloAssoSuccess(`${orders.length} commande(s), ${total} menu(s) → liste de courses mise à jour.`);
      saveHelloAssoConfig();
    } catch (e) {
      setHelloAssoError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setHelloAssoLoading(false);
    }
  }, [
    helloAssoUrl,
    helloAssoToken,
    sandwiches,
    ingredients,
    loadFromOrders,
    addMenuOrders,
    saveHelloAssoConfig,
  ]);

  const toBuyList = items.filter((i) => i.toBuy > 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Liste de courses
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Sélectionnez les sandwichs de la semaine pour générer la liste d&apos;ingrédients et le coût estimé.
          </p>
        </div>
      </header>

      {/* HelloAsso : récupérer les ventes en direct → remplir la liste de courses */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Récupérer les ventes HelloAsso en direct
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Indiquez le lien (URL) de votre API HelloAsso pour récupérer les sandwichs vendus et remplir automatiquement la liste de courses.
        </p>
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Lien API (URL des commandes)</label>
            <input
              type="url"
              value={helloAssoUrl}
              onChange={(e) => setHelloAssoUrl(e.target.value)}
              onBlur={saveHelloAssoConfig}
              placeholder="https://api.helloasso.com/..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Token d’accès (optionnel)</label>
            <input
              type="password"
              value={helloAssoToken}
              onChange={(e) => setHelloAssoToken(e.target.value)}
              onBlur={saveHelloAssoConfig}
              placeholder="Bearer token si requis"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          {helloAssoError && (
            <p className="text-sm text-red-600" role="alert">
              {helloAssoError}
            </p>
          )}
          {helloAssoSuccess && (
            <p className="text-sm text-emerald-700" role="status">
              {helloAssoSuccess}
            </p>
          )}
          <button
            type="button"
            onClick={fetchHelloAssoAndFillList}
            disabled={helloAssoLoading || sandwiches.length === 0}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {helloAssoLoading ? "Récupération…" : "Récupérer les ventes et remplir la liste"}
          </button>
        </div>
      </section>

      {/* Section 1 : Sélection des sandwichs */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Sélection des sandwichs de la semaine
        </h2>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="add-sandwich" className="text-xs text-slate-500">
              Ajouter un sandwich :
            </label>
            <select
              id="add-sandwich"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const s = sandwiches.find((x) => x.id === id);
                if (s) addSelection(s);
                e.target.value = "";
              }}
            >
              <option value="">Choisir…</option>
              {sandwiches.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({s.cout.toFixed(2)} €)
                </option>
              ))}
            </select>
          </div>
          {selections.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun sandwich sélectionné. Ajoutez-en un ci-dessus.
            </p>
          ) : (
            <ul className="space-y-2">
              {selections.map((sel) => (
                <li
                  key={sel.sandwichId}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
                >
                  <span className="font-medium text-slate-800">{sel.sandwich.nom}</span>
                  <label className="sr-only" htmlFor={`count-${sel.sandwichId}`}>
                    Nombre de fois dans la semaine
                  </label>
                  <input
                    id={`count-${sel.sandwichId}`}
                    type="number"
                    min={1}
                    value={sel.count}
                    onChange={(e) => setSelectionCount(sel.sandwichId, parseInt(e.target.value, 10) || 0)}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">fois / semaine</span>
                  <button
                    type="button"
                    onClick={() => removeSelection(sel.sandwichId)}
                    className="ml-auto rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={generateShoppingList}
            disabled={selections.length === 0 || selections.every((s) => s.count <= 0)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            Générer la liste de courses
          </button>
        </div>
      </section>

      {/* Section 2 : Tableau des ingrédients */}
      {items.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Ingrédients calculés
          </h2>
          <ShoppingTable items={items} setStock={setStock} />
        </section>
      )}

      {/* Section 3 : Résumé + liste à acheter + export */}
      {items.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Résumé
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Liste à acheter
              </p>
              {toBuyList.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">
                  Rien à acheter (tout est en stock).
                </p>
              ) : (
                <ul className="mt-1 list-inside list-disc text-sm text-slate-800">
                  {toBuyList.map((i) => (
                    <li key={i.ingredientId}>
                      {i.ingredientName} → {formatQty(i.toBuy, i.unit)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <p className="text-base font-semibold text-slate-900">
                Total estimé des courses : {totalEstimated.toFixed(2)} €
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportShoppingListToCsv(items, totalEstimated)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Exporter CSV
                </button>
                <button
                  type="button"
                  onClick={() => printShoppingListForPdf(items, totalEstimated)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Exporter PDF
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {sandwiches.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          Aucun sandwich disponible. Créez des recettes dans le Générateur puis revenez ici.
        </div>
      )}
    </div>
  );
}
