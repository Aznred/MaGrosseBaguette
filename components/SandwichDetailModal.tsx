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
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Détail du sandwich"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl border border-stone-200/80 bg-white shadow-2xl shadow-stone-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200/80 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <h2 className="font-heading text-xl font-bold text-stone-900">
            Détail du sandwich
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="font-heading text-lg font-semibold text-stone-800">{sandwich.nom}</p>

          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
              Composition & coûts
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-2 text-stone-700">
                <span className="flex items-center gap-2">
                  <CategoryIcon category="pain" size="sm" />
                  Pain (fixe)
                </span>
                <span className="font-mono font-medium">{COUT_PAIN_FIXE.toFixed(2)} €</span>
              </li>
              <li className="flex items-center justify-between gap-2 text-stone-700">
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
                <span className="font-mono font-medium">{ligneProteine.toFixed(2)} €</span>
              </li>
              {sandwich.fromage && (
                <li className="flex items-center justify-between gap-2 text-stone-700">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="fromage" size="sm" />
                    {cleanIngredientName(sandwich.fromage.nom)}
                  </span>
                  <span className="font-mono font-medium">{ligneFromage.toFixed(2)} €</span>
                </li>
              )}
              {sandwich.sauce && (
                <li className="flex items-center justify-between gap-2 text-stone-700">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="sauce" size="sm" />
                    {cleanIngredientName(sandwich.sauce.nom)}
                  </span>
                  <span className="font-mono font-medium">{ligneSauce.toFixed(2)} €</span>
                </li>
              )}
              {(sandwich.legumes ?? []).map((leg) => (
                <li
                  key={leg.id}
                  className="flex items-center justify-between gap-2 text-stone-700"
                >
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="legumes" size="sm" />
                    {cleanIngredientName(leg.nom)}
                  </span>
                  <span className="font-mono font-medium">
                    {coutPortion(leg, quantites.legumes).toFixed(2)} €
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 font-semibold text-stone-900">
              <span>Total sandwich</span>
              <span className="font-mono">{totalSandwich.toFixed(2)} €</span>
            </div>
          </div>

          {menu && (
            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Menu complet (objectif ≤ 3€)
              </p>
              <ul className="space-y-2 text-sm text-stone-700">
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="pain" size="sm" />
                    Sandwich
                  </span>
                  <span className="font-mono font-medium">
                    {menu.sandwich.cout.toFixed(2)} €
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="boisson" size="sm" />
                    {menu.boisson.id === "moyenne" ? "Moyenne boissons" : cleanIngredientName(menu.boisson.nom)}
                  </span>
                  <span className="font-mono font-medium">
                    {(menu.boisson.id === "moyenne" ? avgCoutBoisson : coutPortion(menu.boisson, quantites.boisson)).toFixed(2)} €
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="dessert" size="sm" />
                    {menu.dessert.id === "moyenne" ? "Moyenne desserts" : cleanIngredientName(menu.dessert.nom)}
                  </span>
                  <span className="font-mono font-medium">
                    {(menu.dessert.id === "moyenne" ? avgCoutDessert : coutPortion(menu.dessert, quantites.dessert)).toFixed(2)} €
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryIcon category="emballage" size="sm" />
                    Emballage
                  </span>
                  <span className="font-mono font-medium">
                    {menu.coutEmballage.toFixed(2)} €
                  </span>
                </li>
              </ul>
              <div className="mt-3 flex justify-between border-t border-emerald-200/80 pt-3 font-semibold text-stone-900">
                <span>Total menu</span>
                <span
                  className={`font-mono ${
                    menu.coutTotal <= 3 ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {menu.coutTotal.toFixed(2)} €
                  {menu.coutTotal <= 3 ? " ✓" : " (au-dessus de 3€)"}
                </span>
              </div>
              <div className="mt-3 flex justify-between rounded-xl bg-white/80 px-4 py-2.5 text-sm">
                <span className="text-stone-600">Si vendu à 5€</span>
                <span className="font-mono font-bold text-emerald-700">
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
