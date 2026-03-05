"use client";

import { MenuTable } from "@/components/MenuTable";
import { useIngredientsStore } from "@/store/ingredientsStore";

export default function PlanificateurPage() {
  const { menus } = useIngredientsStore();
  const underBudget = menus.filter((m) => m.coutTotal <= 3).length;
  const best = [...menus].sort((a, b) => a.coutTotal - b.coutTotal)[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Planificateur de menus
        </h1>
        <p className="mt-2 text-stone-600">
          Menus complets (sandwich + boissons et desserts + emballage). Objectif : menus à 3€ ou moins.
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {menus.length} menus générés
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xl shadow-stone-900/5">
          <p className="text-sm font-medium text-stone-500">Menus générés</p>
          <p className="mt-1 font-heading text-2xl font-bold text-stone-900">{menus.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-5 shadow-xl shadow-stone-900/5">
          <p className="text-sm font-medium text-emerald-700">Menus ≤ 3€</p>
          <p className="mt-1 font-heading text-2xl font-bold text-emerald-800">{underBudget}</p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xl shadow-stone-900/5">
          <p className="text-sm font-medium text-stone-500">Meilleur coût menu</p>
          <p className="mt-1 font-heading text-2xl font-bold text-stone-900">
            {best ? `${best.coutTotal.toFixed(2)} €` : "—"}
          </p>
        </div>
      </div>

      {menus.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 text-center">
          <p className="text-stone-500">
            Aucun menu pour l&apos;instant. Importez vos ingrédients puis utilisez le générateur pour créer les menus.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200/80 bg-white shadow-xl shadow-stone-900/5 overflow-x-auto">
          <MenuTable menus={menus} />
        </div>
      )}
    </div>
  );
}
