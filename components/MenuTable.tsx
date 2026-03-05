"use client";

import { useState } from "react";
import type { Menu } from "@/lib/types";
import { useIngredientsStore } from "@/store/ingredientsStore";
import { exportMenusToExcel } from "@/lib/exportExcel";
import { cleanIngredientName } from "@/lib/ingredientName";
import { SandwichDetailModal } from "@/components/SandwichDetailModal";

interface Props {
  menus: Menu[];
}

const BUDGET_MENU_MAX = 3;
const PRIX_VENTE_MENU = 5;

export function MenuTable({ menus }: Props) {
  const toggleFavori = useIngredientsStore((s) => s.toggleFavori);
  const quantites = useIngredientsStore((s) => s.quantites);
  const sandwiches = useIngredientsStore((s) => s.sandwiches);
  const [maxPrix, setMaxPrix] = useState<number | null>(BUDGET_MENU_MAX);
  const [maxCoutSandwich, setMaxCoutSandwich] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [vegetarienOnly, setVegetarienOnly] = useState(false);
  const [showFavorisOnly, setShowFavorisOnly] = useState(false);
  const [underBudgetOnly, setUnderBudgetOnly] = useState(true);
  const [detailMenu, setDetailMenu] = useState<Menu | null>(null);

  const filtered = menus.filter((m) => {
    if (maxPrix !== null && m.coutTotal > maxPrix) return false;
    if (maxCoutSandwich !== null && m.sandwich.cout > maxCoutSandwich) return false;
    if (vegetarienOnly && !m.sandwich.proteine.vegetarien) return false;
    if (showFavorisOnly && !m.favori) return false;
    if (underBudgetOnly && m.coutTotal > BUDGET_MENU_MAX) return false;
    if (
      search.trim() &&
      !m.sandwich.nom.toLowerCase().includes(search.toLowerCase()) &&
      !m.boisson.nom.toLowerCase().includes(search.toLowerCase()) &&
      !m.dessert.nom.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  }).sort((a, b) => a.coutTotal - b.coutTotal);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-stone-200/80 bg-stone-50/30 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:px-6">
        <div className="min-w-0 flex-1 sm:max-w-[280px]">
          <label className="mb-1 block text-sm font-medium text-stone-600">
            Recherche
          </label>
          <input
            type="text"
            placeholder="Sandwich, boisson, dessert..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-600">
            Prix max (€)
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 sm:w-28 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            value={maxPrix ?? ""}
            onChange={(e) =>
              setMaxPrix(e.target.value ? parseFloat(e.target.value) : null)
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-600">
            Coût sandwich max (€)
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 sm:w-32 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            value={maxCoutSandwich ?? ""}
            onChange={(e) =>
              setMaxCoutSandwich(
                e.target.value ? parseFloat(e.target.value) : null,
              )
            }
          />
        </div>
        <div className="flex flex-wrap gap-4 pt-1 sm:pt-0">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-stone-600 sm:min-h-0">
            <input
              type="checkbox"
              checked={vegetarienOnly}
              onChange={(e) => setVegetarienOnly(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            Végétarien uniquement
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-stone-600 sm:min-h-0">
            <input
              type="checkbox"
              checked={showFavorisOnly}
              onChange={(e) => setShowFavorisOnly(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            Favoris
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-stone-600 sm:min-h-0">
            <input
              type="checkbox"
              checked={underBudgetOnly}
              onChange={(e) => setUnderBudgetOnly(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            Menus ≤ 3€
          </label>
        </div>
        <button
          type="button"
          onClick={() => exportMenusToExcel(filtered, quantites, sandwiches)}
          className="w-full shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-emerald-700 sm:ml-auto sm:w-auto"
        >
          Exporter en Excel
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 md:mx-0 md:px-0">
        <table className="min-w-[800px] border-collapse text-left text-sm sm:min-w-[1200px]">
          <thead className="sticky top-0 z-10 bg-stone-100 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <tr>
              <th className="sticky left-0 z-20 min-w-[120px] border border-stone-300 bg-stone-100 px-2 py-2.5 sm:min-w-0 sm:px-3">
                Nom du sandwich
              </th>
              <th className="border border-stone-300 px-3 py-2">Ingrédients</th>
              <th className="border border-stone-300 px-3 py-2">Coût sandwich</th>
              <th className="border border-stone-300 px-3 py-2">Boisson</th>
              <th className="border border-stone-300 px-3 py-2">Dessert</th>
              <th className="border border-stone-300 px-3 py-2">Coût emballage</th>
              <th className="border border-stone-300 px-3 py-2">Coût total menu</th>
              <th className="border border-stone-300 px-3 py-2">Bénéfice si vendu à 5€</th>
              <th className="border border-stone-300 px-3 py-2">Favori</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((menu) => {
              const isCheap = menu.coutTotal <= BUDGET_MENU_MAX;
              const rowColor = isCheap ? "bg-emerald-50/70" : "bg-rose-50/70";

              return (
                <tr
                  key={menu.id}
                  className={`${rowColor} hover:bg-sky-50 cursor-pointer`}
                  onClick={() => setDetailMenu(menu)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setDetailMenu(menu);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Voir le détail du menu"
                >
                  <td className="sticky left-0 max-w-[180px] border border-stone-300 bg-inherit px-2 py-2 font-medium text-stone-800 sm:max-w-none sm:px-3">
                    <span className="line-clamp-2 sm:line-clamp-none">{menu.sandwich.nom}</span>
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-stone-600">
                    {[
                      cleanIngredientName(menu.sandwich.pain.nom),
                      cleanIngredientName(menu.sandwich.proteine.nom),
                      ...(menu.sandwich.fromage ? [cleanIngredientName(menu.sandwich.fromage.nom)] : []),
                      ...(menu.sandwich.sauce ? [cleanIngredientName(menu.sandwich.sauce.nom)] : []),
                      ...(menu.sandwich.legumes?.map((l) =>
                        cleanIngredientName(l.nom),
                      ) ?? []),
                    ].join(" · ")}
                  </td>
                  <td className="border border-stone-300 px-3 py-2 font-mono text-stone-800">
                    {menu.sandwich.cout.toFixed(2)} €
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-stone-600">
                    {menu.boisson.id === "moyenne" ? "Moyenne boissons" : cleanIngredientName(menu.boisson.nom)}
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-stone-600">
                    {menu.dessert.id === "moyenne" ? "Moyenne desserts" : cleanIngredientName(menu.dessert.nom)}
                  </td>
                  <td className="border border-stone-300 px-3 py-2 font-mono text-stone-800">
                    {menu.coutEmballage.toFixed(2)} €
                  </td>
                  <td className="border border-stone-300 px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        isCheap
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {menu.coutTotal.toFixed(2)} €
                    </span>
                  </td>
                  <td className="border border-stone-300 px-3 py-2 font-mono text-sm text-emerald-700">
                    {(PRIX_VENTE_MENU - menu.coutTotal).toFixed(2)} €
                  </td>
                  <td
                    className="border border-stone-300 px-3 py-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFavori(menu.id)}
                      className="text-lg"
                      aria-label={menu.favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      {menu.favori ? "★" : "☆"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="border border-stone-300 px-4 py-6 text-center text-sm text-stone-500"
                >
                  Aucun menu ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailMenu && (
        <SandwichDetailModal
          sandwich={detailMenu.sandwich}
          menu={detailMenu}
          onClose={() => setDetailMenu(null)}
        />
      )}
    </div>
  );
}

