"use client";

import { useState } from "react";
import { useIngredientsStore } from "@/store/ingredientsStore";
import type { Ingredient, IngredientCategory } from "@/lib/types";

const UNIT_OPTIONS: { value: "g" | "kg" | "ml" | "L" | "unite"; label: string }[] = [
  { value: "g", label: "Grammes (g)" },
  { value: "kg", label: "Kilogrammes (kg)" },
  { value: "ml", label: "Millilitres (ml)" },
  { value: "L", label: "Litres (L)" },
  { value: "unite", label: "Unité / pièce" },
];

const CATEGORY_OPTIONS: { value: IngredientCategory; label: string }[] = [
  { value: "pain", label: "Pain" },
  { value: "viande", label: "Viande" },
  { value: "proteine_vegetarienne", label: "Protéine végétarienne" },
  { value: "fromage", label: "Fromage" },
  { value: "sauce", label: "Sauce" },
  { value: "legumes", label: "Légumes" },
  { value: "boisson", label: "Boisson" },
  { value: "dessert", label: "Dessert" },
  { value: "emballage", label: "Emballage" },
];

function toPoidsTotalAndMode(
  quantity: number,
  unit: "g" | "kg" | "ml" | "L" | "unite",
): { poidsTotal: number; modeTarif: "gramme" | "unite" } {
  switch (unit) {
    case "g":
      return { poidsTotal: quantity, modeTarif: "gramme" };
    case "kg":
      return { poidsTotal: quantity * 1000, modeTarif: "gramme" };
    case "ml":
      return { poidsTotal: quantity, modeTarif: "gramme" };
    case "L":
      return { poidsTotal: quantity * 1000, modeTarif: "gramme" };
    case "unite":
      return { poidsTotal: quantity, modeTarif: "unite" };
  }
}

const CATEGORY_STYLE: Record<IngredientCategory, string> = {
  pain: "bg-amber-100 text-amber-800 border-amber-200",
  viande: "bg-rose-100 text-rose-800 border-rose-200",
  proteine_vegetarienne: "bg-lime-100 text-lime-800 border-lime-200",
  fromage: "bg-yellow-100 text-yellow-800 border-yellow-200",
  sauce: "bg-orange-100 text-orange-800 border-orange-200",
  legumes: "bg-green-100 text-green-800 border-green-200",
  boisson: "bg-cyan-100 text-cyan-800 border-cyan-200",
  dessert: "bg-pink-100 text-pink-800 border-pink-200",
  emballage: "bg-slate-100 text-stone-700 border-stone-200/80",
};

export default function IngredientsPage() {
  const { ingredients, addIngredients, removeIngredient } = useIngredientsStore();
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [quantite, setQuantite] = useState("");
  const [unite, setUnite] = useState<"g" | "kg" | "ml" | "L" | "unite">("g");
  const [categorie, setCategorie] = useState<IngredientCategory>("viande");
  const [vegetarien, setVegetarien] = useState(false);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const nomTrim = nom.trim();
    const prixStr = prix.replace(",", ".").trim();
    const quantiteStr = quantite.replace(",", ".").trim();
    const prixNum = parseFloat(prixStr);
    const quantiteNum = parseFloat(quantiteStr);
    if (!nomTrim || !Number.isFinite(prixNum) || prixNum < 0) return;
    if (!Number.isFinite(quantiteNum) || quantiteNum <= 0) return;

    const { poidsTotal, modeTarif } = toPoidsTotalAndMode(quantiteNum, unite);
    if (poidsTotal <= 0) return;

    const newIngredient: Ingredient = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      nom: nomTrim,
      categorie,
      prixTotal: prixNum,
      poidsTotal,
      prixParGramme: prixNum / poidsTotal,
      modeTarif,
      vegetarien,
    };
    addIngredients([newIngredient]);
    setNom("");
    setPrix("");
    setQuantite("");
  };

  return (
    <div className="min-h-0 space-y-10">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Ingrédients
        </h1>
        <p className="mt-2 text-stone-600">
          Gérez vos produits : ajoutez nom, prix, quantité et catégorie pour vos recettes.
        </p>
      </header>

      <section className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-xl shadow-stone-900/5 sm:p-8">
        <h2 className="mb-5 flex items-center gap-2 font-heading text-lg font-bold text-stone-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              +
            </span>
            Nouveau produit
          </h2>
          <form onSubmit={handleAddProduct} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Nom du produit</span>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Poulet fermier, Baguette, Mozzarella..."
                className="min-h-[44px] touch-manipulation rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-base text-stone-900 placeholder-stone-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                required
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-stone-700">Prix (€)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  placeholder="12,50"
                  className="rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-stone-900 placeholder-stone-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-stone-700">Quantité</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  placeholder="500"
                  className="rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-stone-900 placeholder-stone-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  required
                />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-stone-700">Unité</span>
                <select
                  value={unite}
                  onChange={(e) => setUnite(e.target.value as typeof unite)}
                  className="rounded-xl border border-stone-200/80 bg-slate-50/50 px-4 py-3 text-stone-800 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  aria-label="Choisir l'unité"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-stone-700">Catégorie</span>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as IngredientCategory)}
                  className="rounded-xl border border-stone-200/80 bg-slate-50/50 px-4 py-3 text-stone-800 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  aria-label="Choisir la catégorie"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200/80 bg-slate-50/50 px-4 py-3 transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-400/20">
              <input
                type="checkbox"
                checked={vegetarien}
                onChange={(e) => setVegetarien(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
              />
              <span className="text-sm font-medium text-stone-700">Végétarien</span>
            </label>
            <button
              type="submit"
              className="min-h-[44px] w-full touch-manipulation rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 hover:shadow-emerald-600/30 active:bg-emerald-800 sm:w-auto"
            >
              Ajouter le produit
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
          <h2 className="mb-5 flex items-center gap-2 font-heading text-lg font-bold text-stone-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
              {ingredients.length}
            </span>
            Liste des ingrédients
          </h2>
          {ingredients.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 text-center">
              <p className="text-stone-500">
                Aucun ingrédient pour l’instant. Ajoutez-en un avec le formulaire ci-dessus.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="group rounded-2xl border border-stone-200/80 bg-stone-50/30 p-4 transition hover:border-stone-300 hover:bg-white hover:shadow-lg hover:shadow-stone-900/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-stone-900" title={ing.nom}>
                        {ing.nom}
                      </p>
                      <span
                        className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLE[ing.categorie]}`}
                      >
                        {ing.categorie.replace("_", " ")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Supprimer « ${ing.nom} » ? Les recettes qui l'utilisent seront aussi supprimées.`
                          )
                        ) {
                          removeIngredient(ing.id);
                        }
                      }}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 opacity-70 transition hover:bg-rose-50 hover:opacity-100"
                      aria-label={`Supprimer ${ing.nom}`}
                    >
                      Supprimer
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                    <span>
                      {ing.prixTotal.toFixed(2)} € / {ing.poidsTotal} {ing.modeTarif === "gramme" ? "g" : "u"}
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                      {(ing.prixTotal / ing.poidsTotal).toFixed(4)} €/{ing.modeTarif === "gramme" ? "g" : "u"}
                    </span>
                    {ing.vegetarien && (
                      <span className="rounded-md bg-lime-100 px-2 py-0.5 font-medium text-lime-700">
                        Végétarien
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
    </div>
  );
}
