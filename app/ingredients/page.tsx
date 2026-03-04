 "use client";

import { MetroImport } from "@/components/MetroImport";
import { useIngredientsStore } from "@/store/ingredientsStore";

export default function IngredientsPage() {
  const { ingredients } = useIngredientsStore();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Ingrédients METRO
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez vos ingrédients, leurs catégories et leurs coûts.
          </p>
        </div>
      </header>

      <MetroImport />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Liste des ingrédients ({ingredients.length})
        </h2>
        {ingredients.length === 0 ? (
          <p className="text-xs text-slate-500">
            Importez un fichier METRO pour voir les ingrédients ici.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ingredients.map((ing) => (
              <div
                key={ing.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-800">{ing.nom}</div>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-700">
                    {ing.categorie}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span>
                    {ing.prixTotal.toFixed(2)} € / {ing.poidsTotal.toFixed(2)}{" "}
                    {ing.modeTarif === "gramme" ? "g" : "u"}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                    {(ing.prixTotal / ing.poidsTotal).toFixed(4)} €
                    {ing.modeTarif === "gramme" ? "/g" : "/u"}
                  </span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-700">
                    {ing.modeTarif === "gramme"
                      ? "Produit pondéré"
                      : "Produit au pack/unité"}
                  </span>
                  {ing.vegetarien && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                      Végétarien
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

