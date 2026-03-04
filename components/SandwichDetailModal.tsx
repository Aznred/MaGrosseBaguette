"use client";

import type { Menu, Sandwich } from "@/lib/types";
import { cleanIngredientName } from "@/lib/ingredientName";
import { coutPortion } from "@/lib/pricing";
import { useIngredientsStore } from "@/store/ingredientsStore";
import { CategoryIcon } from "@/components/CategoryIcon";

const COUT_PAIN_FIXE = 0.5;

interface Props {
  sandwich: Sandwich;
  menu?: Menu | null;
  onClose: () => void;
}

export function SandwichDetailModal({ sandwich, menu, onClose }: Props) {
  const { quantites, ingredients } = useIngredientsStore();

  const ligneProteine = coutPortion(sandwich.proteine, quantites.proteine);
  const ligneFromage = sandwich.fromage ? coutPortion(sandwich.fromage, quantites.fromage) : 0;
  const ligneSauce = sandwich.sauce ? coutPortion(sandwich.sauce, quantites.sauce) : 0;
  const totalSandwich = sandwich.cout;

  const boissons = ingredients.filter((i) => i.categorie === "boisson");
  const desserts = ingredients.filter((i) => i.categorie === "dessert");
  const avgCoutBoisson =
    boissons.length > 0
      ? boissons.reduce((s, b) => s + coutPortion(b, quantites.boisson), 0) / boissons.length
      : 0;
  const avgCoutDessert =
    desserts.length > 0
      ? desserts.reduce((s, d) => s + coutPortion(d, quantites.dessert), 0) / desserts.length
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Détail du sandwich"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Détail du sandwich
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="text-sm font-medium text-slate-800">{sandwich.nom}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Composition & coûts
            </p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center justify-between gap-2 text-slate-700">
                <span className="flex items-center gap-2">
                  <CategoryIcon category="pain" size="sm" />
                  Pain (fixe)
                </span>
                <span className="font-mono">{COUT_PAIN_FIXE.toFixed(2)} €</span>
              </li>
              <li className="flex items-center justify-between gap-2 text-slate-700">
                <span className="flex items-center gap-2">
                  <CategoryIcon
                    category={
                      sandwich.proteine.categorie === "proteine_vegetarienne"
                        ? "proteine_vegetarienne"
                        : "viande"
                    }
                    size="sm"
                  />
                  {cleanIngredientName(sandwich.proteine.nom)}
                </span>
                <span className="font-mono">{ligneProteine.toFixed(2)} €</span>
              </li>
              {sandwich.fromage && (
                <li className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="fromage" size="sm" />
                    {cleanIngredientName(sandwich.fromage.nom)}
                  </span>
                  <span className="font-mono">{ligneFromage.toFixed(2)} €</span>
                </li>
              )}
              {sandwich.sauce && (
                <li className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="sauce" size="sm" />
                    {cleanIngredientName(sandwich.sauce.nom)}
                  </span>
                  <span className="font-mono">{ligneSauce.toFixed(2)} €</span>
                </li>
              )}
              {(sandwich.legumes ?? []).map((leg) => (
                <li
                  key={leg.id}
                  className="flex items-center justify-between gap-2 text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="legumes" size="sm" />
                    {cleanIngredientName(leg.nom)}
                  </span>
                  <span className="font-mono">
                    {coutPortion(leg, quantites.legumes).toFixed(2)} €
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
              <span>Total sandwich</span>
              <span className="font-mono">{totalSandwich.toFixed(2)} €</span>
            </div>
          </div>

          {menu && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Menu complet (≤ 3€ objectif)
              </p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="pain" size="sm" />
                    Sandwich
                  </span>
                  <span className="font-mono">
                    {menu.sandwich.cout.toFixed(2)} €
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="boisson" size="sm" />
                    {menu.boisson.id === "moyenne" ? "Moyenne boissons" : cleanIngredientName(menu.boisson.nom)}
                  </span>
                  <span className="font-mono">
                    {(menu.boisson.id === "moyenne" ? avgCoutBoisson : coutPortion(menu.boisson, quantites.boisson)).toFixed(2)} €
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="dessert" size="sm" />
                    {menu.dessert.id === "moyenne" ? "Moyenne desserts" : cleanIngredientName(menu.dessert.nom)}
                  </span>
                  <span className="font-mono">
                    {(menu.dessert.id === "moyenne" ? avgCoutDessert : coutPortion(menu.dessert, quantites.dessert)).toFixed(2)} €
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="emballage" size="sm" />
                    Emballage
                  </span>
                  <span className="font-mono">
                    {menu.coutEmballage.toFixed(2)} €
                  </span>
                </li>
              </ul>
              <div className="mt-2 flex justify-between border-t border-emerald-200 pt-2 text-sm font-semibold text-slate-900">
                <span>Total menu</span>
                <span
                  className={`font-mono ${
                    menu.coutTotal <= 3 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {menu.coutTotal.toFixed(2)} €
                  {menu.coutTotal <= 3 ? " ✓" : " (au-dessus de 3€)"}
                </span>
              </div>
              <div className="mt-2 flex justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-600">Si vendu à 5€</span>
                <span className="font-mono font-semibold text-emerald-700">
                  Bénéfice : {(5 - menu.coutTotal).toFixed(2)} €
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
