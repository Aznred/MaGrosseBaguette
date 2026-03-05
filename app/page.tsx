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
  const underBudget = menus.filter((m) => m.coutTotal <= 3).length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="animate-fade-in">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Dashboard des menus
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          Visualisez les coûts et trouvez les combinaisons les plus rentables.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/80 px-5 py-2.5">
            <span className="text-sm font-semibold text-emerald-800">
              Objectif : coût menu ≤ 3€
            </span>
          </div>
          <div className="flex gap-6 text-sm text-stone-500">
            <span><strong className="text-stone-700">{ingredients.length}</strong> ingrédients</span>
            <span><strong className="text-stone-700">{menus.length}</strong> menus</span>
            <span><strong className="text-emerald-700">{underBudget}</strong> menus ≤ 3€</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr,1fr]">
        <div className="min-w-0 space-y-6">
          <MetroImport />

          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-heading text-xl font-bold text-stone-900">
                Menus les moins chers
              </h2>
              <button
                type="button"
                onClick={generate}
                disabled={!ingredients.length}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Recalculer les coûts
              </button>
            </div>
            {topMenus.length === 0 ? (
              <div className="mt-6 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 text-center">
                <p className="text-stone-500">
                  Importez des ingrédients et créez des recettes dans le Générateur pour voir les menus.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                {topMenus.map((menu, index) => {
                  const isCheap = menu.coutTotal <= 3;
                  const name = menu.sandwich.nom.includes(":")
                    ? menu.sandwich.nom.split(":")[0].trim()
                    : menu.sandwich.nom.length > 25
                      ? menu.sandwich.nom.slice(0, 22) + "…"
                      : menu.sandwich.nom;
                  return (
                    <button
                      key={menu.id}
                      type="button"
                      onClick={() => setDetailMenu(menu)}
                      className="group animate-fade-in rounded-2xl border border-stone-200/80 bg-stone-50/30 p-4 text-left transition hover:border-amber-200 hover:bg-white hover:shadow-lg hover:shadow-stone-900/5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <p className="mb-3 min-h-[2rem] font-heading text-sm font-semibold text-stone-800 line-clamp-2">
                        {name}
                      </p>
                      <SandwichVisualCard sandwich={menu.sandwich} compact />
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isCheap
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {menu.coutTotal.toFixed(2)} €
                        </span>
                        <span className="text-xs text-stone-400">menu</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
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
