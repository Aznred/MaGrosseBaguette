 "use client";

import { MenuTable } from "@/components/MenuTable";
import { useIngredientsStore } from "@/store/ingredientsStore";

export default function PlanificateurPage() {
  const { menus } = useIngredientsStore();
  const underBudget = menus.filter((m) => m.coutTotal <= 3).length;
  const best = [...menus].sort((a, b) => a.coutTotal - b.coutTotal)[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Planificateur de menus
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Menus complets (sandwich + moyenne boissons et desserts + emballage). Par défaut
            : uniquement les menus à 3€ ou moins. Cliquez sur une ligne pour le détail.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {menus.length} menus générés
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">Menus générés</p>
          <p className="text-xl font-semibold text-slate-900">{menus.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">Menus ≤ 3€ (boisson + dessert compris)</p>
          <p className="text-xl font-semibold text-emerald-700">{underBudget}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">Meilleur coût menu</p>
          <p className="text-xl font-semibold text-sky-700">
            {best ? `${best.coutTotal.toFixed(2)} €` : "-"}
          </p>
        </div>
      </div>

      {menus.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
          Aucun menu pour l&apos;instant. Importez vos ingrédients puis
          utilisez le générateur pour créer les menus.
        </div>
      ) : (
        <MenuTable menus={menus} />
      )}
    </div>
  );
}

