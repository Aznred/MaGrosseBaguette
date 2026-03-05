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

/** Affiche "Acheter X × Nom" si on connaît le produit (poids/unité), sinon "Nom → quantité" */
function formatToBuyLabel(
  ingredientName: string,
  toBuy: number,
  unit: "g" | "u",
  ingredient?: { poidsTotal: number }
): string {
  if (ingredient && ingredient.poidsTotal > 0) {
    const packs = Math.ceil(toBuy / ingredient.poidsTotal);
    if (packs > 0) return `Acheter ${packs} × ${ingredientName}`;
  }
  return `${ingredientName} → ${formatQty(toBuy, unit)}`;
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
    <div className="-mx-4 overflow-x-auto overscroll-x-contain rounded-2xl border border-stone-200/80 bg-white shadow-lg md:mx-0">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            <th className="px-4 py-3 font-semibold text-stone-700">Ingrédient</th>
            <th className="px-4 py-3 font-semibold text-stone-700">Quantité nécessaire</th>
            <th className="px-4 py-3 font-semibold text-stone-700">Déjà en stock</th>
            <th className="px-4 py-3 font-semibold text-stone-700">À acheter</th>
            <th className="px-4 py-3 font-semibold text-stone-700">Prix estimé</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const toBuyLabel =
              item.toBuy > 0
                ? formatToBuyLabel(
                    item.ingredientName,
                    item.toBuy,
                    item.unit,
                    item.ingredient
                  )
                : "—";
            return (
              <tr key={item.ingredientId} className="border-b border-stone-100">
                <td className="px-4 py-2.5 font-medium text-stone-900">{item.ingredientName}</td>
                <td className="px-4 py-2.5 text-stone-600">{formatQty(item.quantityNeeded, item.unit)}</td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    min={0}
                    step={item.unit === "g" ? 10 : 1}
                    value={item.stock}
                    onChange={(e) => setStock(item.ingredientId, parseFloat(e.target.value) || 0)}
                    className="min-h-[44px] w-20 touch-manipulation rounded-xl border border-stone-200 bg-white px-2 py-2 text-base text-stone-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </td>
                <td className="px-4 py-2.5 font-medium text-stone-800">
                  {item.toBuy > 0 ? toBuyLabel : "—"}
                </td>
                <td className="px-4 py-2.5 text-emerald-700">
                  {item.priceEstimated > 0 ? `${item.priceEstimated.toFixed(2)} €` : "—"}
                </td>
              </tr>
            );
          })}
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
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Liste de courses
        </h1>
        <p className="mt-2 text-stone-600">
          Sélectionnez les sandwichs de la semaine pour générer la liste d&apos;ingrédients et le coût estimé.
        </p>
      </header>

      {/* HelloAsso : récupérer les ventes en direct → remplir la liste de courses */}
      <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <h2 className="mb-3 font-heading text-lg font-bold text-stone-900">
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
      <section className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-xl shadow-stone-900/5 sm:p-8">
        <h2 className="mb-4 font-heading text-lg font-bold text-stone-900">
          Sélection des sandwichs de la semaine
        </h2>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="add-sandwich" className="text-xs text-slate-500">
              Ajouter un sandwich :
            </label>
            <select
              id="add-sandwich"
              className="min-h-[44px] w-full touch-manipulation rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-base text-stone-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 sm:w-auto sm:text-sm"
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
                    className="min-h-[44px] w-16 touch-manipulation rounded-xl border border-stone-200 bg-white px-2 py-2 text-center text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
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
            className="min-h-[44px] w-full touch-manipulation rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none sm:w-auto sm:py-2"
          >
            Générer la liste de courses
          </button>
        </div>
      </section>

      {/* Section 2 : Tableau des ingrédients */}
      {items.length > 0 && (
        <section className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-xl shadow-stone-900/5 sm:p-8">
          <h2 className="mb-4 font-heading text-lg font-bold text-stone-900">
            Ingrédients calculés
          </h2>
          <ShoppingTable items={items} setStock={setStock} />
        </section>
      )}

      {/* Section 3 : Résumé + liste à acheter + export */}
      {items.length > 0 && (
        <section className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-xl shadow-stone-900/5 sm:p-8">
          <h2 className="mb-4 font-heading text-lg font-bold text-stone-900">
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
                      {formatToBuyLabel(i.ingredientName, i.toBuy, i.unit, i.ingredient)}
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
                  className="min-h-[44px] touch-manipulation rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Exporter CSV
                </button>
                <button
                  type="button"
                  onClick={() => printShoppingListForPdf(items, totalEstimated)}
                  className="min-h-[44px] touch-manipulation rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Exporter PDF
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {sandwiches.length === 0 && (
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 text-sm text-stone-500 shadow-xl shadow-stone-900/5">
          Aucun sandwich disponible. Créez des recettes dans le Générateur puis revenez ici.
        </div>
      )}
    </div>
  );
}
