"use client";

import { useState } from "react";
import { MetroImport } from "@/components/MetroImport";
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

export default function IngredientsPage() {
  const { ingredients, addIngredients } = useIngredientsStore();
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [quantite, setQuantite] = useState("");
  const [unite, setUnite] = useState<"g" | "kg" | "ml" | "L" | "unite">("g");
  const [categorie, setCategorie] = useState<IngredientCategory>("viande");
  const [vegetarien, setVegetarien] = useState(false);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const nomTrim = nom.trim();
    const prixNum = parseFloat(prix.replace(",", "."));
    const quantiteNum = parseFloat(quantite.replace(",", "."));
    if (!nomTrim || !Number.isFinite(prixNum) || prixNum < 0 || !Number.isFinite(quantiteNum) || quantiteNum <= 0) return;

    const { poidsTotal, modeTarif } = toPoidsTotalAndMode(quantiteNum, unite);
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
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Ingrédients
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Importez un CSV METRO ou ajoutez des produits à la main (nom, prix, poids ou unité, type).
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Ajouter un produit sans CSV
        </h2>
        <form onSubmit={handleAddProduct} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Nom</span>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Poulet fermier"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Prix (€)</span>
            <input
              type="text"
              inputMode="decimal"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="Ex: 12,50"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Quantité</span>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                placeholder="Ex: 500"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                required
              />
              <select
                value={unite}
                onChange={(e) => setUnite(e.target.value as typeof unite)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Type</span>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as IngredientCategory)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
            <input
              type="checkbox"
              checked={vegetarien}
              onChange={(e) => setVegetarien(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-xs text-slate-600">Végétarien</span>
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Ajouter le produit
            </button>
          </div>
        </form>
      </div>

      <MetroImport />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Liste des ingrédients ({ingredients.length})
        </h2>
        {ingredients.length === 0 ? (
          <p className="text-xs text-slate-500">
            Ajoutez des produits avec le formulaire ci-dessus ou importez un fichier METRO.
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
