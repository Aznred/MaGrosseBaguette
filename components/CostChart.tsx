"use client";

import { Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartData,
} from "chart.js";
import type { Ingredient } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS = [
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
];

interface Props {
  ingredients: Ingredient[];
}

export function CostChart({ ingredients }: Props) {
  if (!ingredients.length) {
    return (
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <h3 className="font-heading text-lg font-bold text-stone-900">
          Répartition du coût par catégorie
        </h3>
        <div className="mt-6 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
          <p className="text-sm text-stone-500">
            Importez des ingrédients pour voir le graphique.
          </p>
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(ingredients.map((i) => i.categorie)));
  const dataByCat = categories.map((cat) =>
    ingredients
      .filter((i) => i.categorie === cat)
      .reduce((sum, i) => sum + i.prixTotal, 0),
  );

  const data: ChartData<"doughnut"> = {
    labels: categories.map((c) => c.replace("_", " ")),
    datasets: [
      {
        data: dataByCat,
        backgroundColor: CHART_COLORS.slice(0, categories.length),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
      <h3 className="font-heading text-lg font-bold text-stone-900">
        Répartition du coût par catégorie
      </h3>
      <div className="mt-6">
        <Doughnut
          data={data}
          options={{
            cutout: "58%",
            plugins: {
              legend: { position: "bottom" },
            },
          }}
        />
      </div>
    </div>
  );
}
