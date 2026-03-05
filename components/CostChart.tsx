"use client";

import { Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartData,
} from "chart.js";
import type { Ingredient, IngredientCategory } from "@/lib/types";
import type { QuantitesUtilisation } from "@/lib/pricing";
import { coutPortion } from "@/lib/pricing";

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS: Record<string, string> = {
  pain: "#eab308",
  viande: "#dc2626",
  proteine_vegetarienne: "#22c55e",
  fromage: "#f97316",
  sauce: "#a855f7",
  legumes: "#16a34a",
  boisson: "#0ea5e9",
  dessert: "#ec4899",
  emballage: "#64748b",
};

const COUT_PAIN_FIXE = 0.5;

function getCoutParPortion(
  ing: Ingredient,
  quantites: QuantitesUtilisation
): number {
  switch (ing.categorie) {
    case "pain":
      return COUT_PAIN_FIXE;
    case "viande":
    case "proteine_vegetarienne":
      return coutPortion(ing, quantites.proteine);
    case "fromage":
      return coutPortion(ing, quantites.fromage);
    case "sauce":
      return coutPortion(ing, quantites.sauce);
    case "legumes":
      return coutPortion(ing, quantites.legumes);
    case "boisson":
      return coutPortion(ing, quantites.boisson);
    case "dessert":
      return coutPortion(ing, quantites.dessert);
    case "emballage":
      return coutPortion(ing, quantites.emballage);
    default:
      return coutPortion(ing, quantites.proteine);
  }
}

function labelCategory(cat: IngredientCategory): string {
  const labels: Record<IngredientCategory, string> = {
    pain: "Pain",
    viande: "Viande",
    proteine_vegetarienne: "Protéine végétarienne",
    fromage: "Fromage",
    sauce: "Sauce",
    legumes: "Légumes",
    boisson: "Boisson",
    dessert: "Dessert",
    emballage: "Emballage",
  };
  return labels[cat] ?? cat;
}

interface Props {
  ingredients: Ingredient[];
  quantites: QuantitesUtilisation;
}

export function CostChart({ ingredients, quantites }: Props) {
  if (!ingredients.length) {
    return (
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <h3 className="font-heading text-lg font-bold text-stone-900">
          Coût moyen par catégorie dans un menu
        </h3>
        <div className="mt-6 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
          <p className="text-sm text-stone-500">
            Importez des ingrédients pour voir le graphique.
          </p>
        </div>
      </div>
    );
  }

  const byCategory = new Map<IngredientCategory, number[]>();
  for (const ing of ingredients) {
    const cost = getCoutParPortion(ing, quantites);
    const list = byCategory.get(ing.categorie) ?? [];
    list.push(cost);
    byCategory.set(ing.categorie, list);
  }

  const categories = Array.from(byCategory.keys()).sort();
  const averages = categories.map((cat) => {
    const list = byCategory.get(cat)!;
    const sum = list.reduce((a, b) => a + b, 0);
    return list.length > 0 ? sum / list.length : 0;
  });

  const data: ChartData<"doughnut"> = {
    labels: categories.map(labelCategory),
    datasets: [
      {
        data: averages.map((v) => Math.round(v * 100) / 100),
        backgroundColor: categories.map((c) => CHART_COLORS[c] ?? "#94a3b8"),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
      <h3 className="font-heading text-lg font-bold text-stone-900">
        Coût moyen par catégorie dans un menu
      </h3>
      <p className="mt-1 text-xs text-stone-500">
        Moyenne des coûts par portion des ingrédients utilisés dans les sandwichs, par catégorie.
      </p>
      <div className="mt-6">
        <Doughnut
          data={data}
          options={{
            cutout: "58%",
            plugins: {
              legend: { position: "bottom" },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const cat = categories[ctx.dataIndex];
                    const avg = averages[ctx.dataIndex];
                    const count = byCategory.get(cat)?.length ?? 0;
                    return `${labelCategory(cat)}: ${avg.toFixed(2)} € en moyenne (${count} ingrédient${count > 1 ? "s" : ""})`;
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
