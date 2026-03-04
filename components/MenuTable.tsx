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
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3">
        <input
          type="text"
          placeholder="Recherche sandwich/boisson/dessert"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-60 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
        />
        <div>
          <label className="text-xs font-medium text-slate-500">
            Prix max (€)
          </label>
          <input
            type="number"
            step="0.1"
            className="mt-1 w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
            value={maxPrix ?? ""}
            onChange={(e) =>
              setMaxPrix(e.target.value ? parseFloat(e.target.value) : null)
            }
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">
            Coût sandwich max (€)
          </label>
          <input
            type="number"
            step="0.1"
            className="mt-1 w-32 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
            value={maxCoutSandwich ?? ""}
            onChange={(e) =>
              setMaxCoutSandwich(
                e.target.value ? parseFloat(e.target.value) : null,
              )
            }
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={vegetarienOnly}
            onChange={(e) => setVegetarienOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          Végétarien uniquement
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showFavorisOnly}
            onChange={(e) => setShowFavorisOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          Favoris
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={underBudgetOnly}
            onChange={(e) => setUnderBudgetOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          Menus ≤ 3€ (sandwich + boisson + dessert + emballage)
        </label>
        <button
          type="button"
          onClick={() => exportMenusToExcel(filtered, quantites, sandwiches)}
          className="ml-auto inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Exporter en Excel
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-300 bg-white shadow-sm">
        <table className="min-w-[1200px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="sticky left-0 z-20 border border-slate-300 bg-slate-100 px-3 py-2">
                Nom du sandwich
              </th>
              <th className="border border-slate-300 px-3 py-2">Ingrédients</th>
              <th className="border border-slate-300 px-3 py-2">Coût sandwich</th>
              <th className="border border-slate-300 px-3 py-2">Boisson</th>
              <th className="border border-slate-300 px-3 py-2">Dessert</th>
              <th className="border border-slate-300 px-3 py-2">Coût emballage</th>
              <th className="border border-slate-300 px-3 py-2">Coût total menu</th>
              <th className="border border-slate-300 px-3 py-2">Bénéfice si vendu à 5€</th>
              <th className="border border-slate-300 px-3 py-2">Favori</th>
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
                  <td className="sticky left-0 border border-slate-300 bg-inherit px-3 py-2 font-medium text-slate-800">
                    {menu.sandwich.nom}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-slate-600">
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
                  <td className="border border-slate-300 px-3 py-2 font-mono text-slate-800">
                    {menu.sandwich.cout.toFixed(2)} €
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-slate-600">
                    {menu.boisson.id === "moyenne" ? "Moyenne boissons" : cleanIngredientName(menu.boisson.nom)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-slate-600">
                    {menu.dessert.id === "moyenne" ? "Moyenne desserts" : cleanIngredientName(menu.dessert.nom)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 font-mono text-slate-800">
                    {menu.coutEmballage.toFixed(2)} €
                  </td>
                  <td className="border border-slate-300 px-3 py-2">
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
                  <td className="border border-slate-300 px-3 py-2 font-mono text-sm text-emerald-700">
                    {(PRIX_VENTE_MENU - menu.coutTotal).toFixed(2)} €
                  </td>
                  <td
                    className="border border-slate-300 px-3 py-2 text-center"
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
                  className="border border-slate-300 px-4 py-6 text-center text-sm text-slate-500"
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

