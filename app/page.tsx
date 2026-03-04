"use client";

import { useState } from "react";
import { MetroImport } from "@/components/MetroImport";
import { CostChart } from "@/components/CostChart";
import { SandwichVisualCard } from "@/components/SandwichVisualCard";
import { SandwichDetailModal } from "@/components/SandwichDetailModal";
import { useIngredientsStore } from "@/store/ingredientsStore";
import type { Menu } from "@/lib/types";

export default function Home() {
  const { ingredients, menus, generate } = useIngredientsStore();
  const menusTries = [...menus].sort((a, b) => a.coutTotal - b.coutTotal);
  const topMenus = menusTries.slice(0, 5);
  const [detailMenu, setDetailMenu] = useState<Menu | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Dashboard des menus
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visualisez les coûts et trouvez les combinaisons de menus les plus
            rentables.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
          Objectif : coût menu ≤ 3€
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr,1.1fr]">
        <div className="min-w-0 space-y-4">
          <MetroImport />
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!ingredients.length}
            >
              Recalculer les coûts
            </button>
            <div className="flex gap-4 text-xs text-slate-500">
              <span>{ingredients.length} ingrédients importés</span>
              <span>{menus.length} menus</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Menus les moins chers
            </h2>
            {topMenus.length === 0 ? (
              <p className="text-xs text-slate-500">
                Importez des ingrédients et créez des recettes dans le Générateur
                pour voir les menus.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {topMenus.map((menu, index) => {
                  const isCheap = menu.coutTotal <= 3;
                  return (
                    <div
                      key={menu.id}
                      onClick={() => setDetailMenu(menu)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setDetailMenu(menu);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Voir le détail : ${menu.sandwich.nom}`}
                      className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 rounded-2xl"
                    >
                      <p className="mb-2 min-h-[1.5rem] text-center text-xs font-semibold text-slate-800">
                        {menu.sandwich.nom.includes(":")
                          ? menu.sandwich.nom.split(":")[0].trim()
                          : menu.sandwich.nom.length > 25
                            ? menu.sandwich.nom.slice(0, 22) + "…"
                            : menu.sandwich.nom}
                      </p>
                      <SandwichVisualCard
                        sandwich={menu.sandwich}
                        compact
                      />
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isCheap
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {menu.coutTotal.toFixed(2)} €
                        </span>
                        <span className="text-[10px] text-slate-500">
                          menu
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <CostChart ingredients={ingredients} />
        </div>
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


