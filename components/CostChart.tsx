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

interface Props {
  ingredients: Ingredient[];
}

export function CostChart({ ingredients }: Props) {
  if (!ingredients.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Répartition du coût par catégorie
        </h3>
        <p className="text-xs text-slate-500">
          Importez des ingrédients pour voir le graphique.
        </p>
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
    labels: categories,
    datasets: [
      {
        data: dataByCat,
        backgroundColor: [
          "#0f766e",
          "#2563eb",
          "#fbbf24",
          "#f97316",
          "#db2777",
          "#22c55e",
          "#6366f1",
          "#14b8a6",
          "#94a3b8",
        ],
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">
        Répartition du coût par catégorie
      </h3>
      <Doughnut data={data} />
    </div>
  );
}

