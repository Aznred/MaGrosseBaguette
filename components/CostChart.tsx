"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { Ingredient } from "@/lib/types";
import type { QuantitesUtilisation } from "@/lib/pricing";
import { coutPortion } from "@/lib/pricing";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BAR_COLORS = [
  "#059669",
  "#0d9488",
  "#0891b2",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#64748b",
  "#14b8a6",
  "#8b5cf6",
  "#f43f5e",
  "#84cc16",
  "#0ea5e9",
];

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

const MAX_INGREDIENTS = 16;

interface Props {
  ingredients: Ingredient[];
  quantites: QuantitesUtilisation;
}

export function CostChart({ ingredients, quantites }: Props) {
  if (!ingredients.length) {
    return (
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <h3 className="font-heading text-lg font-bold text-stone-900">
          Coût moyen des ingrédients dans un menu
        </h3>
        <div className="mt-6 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
          <p className="text-sm text-stone-500">
            Importez des ingrédients pour voir le graphique.
          </p>
        </div>
      </div>
    );
  }

  const withCost = ingredients.map((ing) => ({
    ing,
    cost: getCoutParPortion(ing, quantites),
  }));
  const sorted = [...withCost].sort((a, b) => b.cost - a.cost);
  const top = sorted.slice(0, MAX_INGREDIENTS);

  const labels = top.map(({ ing }) =>
    ing.nom.length > 22 ? ing.nom.slice(0, 19) + "…" : ing.nom
  );
  const dataValues = top.map(({ cost }) => Math.round(cost * 100) / 100);
  const colors = top.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]);

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.2,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = top[ctx.dataIndex];
            return item ? `${item.ing.nom}: ${item.cost.toFixed(2)} € par portion` : "";
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: "Coût (€) par portion dans un menu" },
        ticks: { maxTicksLimit: 6 },
      },
      y: {
        ticks: {
          font: { size: 11 },
          autoSkip: false,
        },
      },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
      <h3 className="font-heading text-lg font-bold text-stone-900">
        Coût moyen des ingrédients dans un menu
      </h3>
      <p className="mt-1 text-xs text-stone-500">
        Coût par portion (selon les quantités du générateur). Top {MAX_INGREDIENTS} ingrédients.
      </p>
      <div className="mt-4 h-[320px] sm:h-[380px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
