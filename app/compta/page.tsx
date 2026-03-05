"use client";

import { useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useIngredientsStore } from "@/store/ingredientsStore";
import { coutPortion } from "@/lib/pricing";
import { prixVenteUnitaire } from "@/lib/exportExcel";
import { exportComptaToExcel } from "@/lib/exportExcel";
import { cleanIngredientName } from "@/lib/ingredientName";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

const PRIX_VENTE_MENU = 5;

type ChartType =
  | "menus_par_sandwich"
  | "ca_par_sandwich"
  | "repartition_ca"
  | "boissons_vendues"
  | "snacks_vendus"
  | "benefice_par_sandwich";

const CHART_OPTIONS: { value: ChartType; label: string }[] = [
  { value: "menus_par_sandwich", label: "Menus vendus par sandwich" },
  { value: "ca_par_sandwich", label: "CA par sandwich (menus)" },
  { value: "benefice_par_sandwich", label: "Bénéfice par sandwich (menus)" },
  { value: "repartition_ca", label: "Répartition du CA (menus / boissons / snacks)" },
  { value: "boissons_vendues", label: "Boissons vendues à l'unité" },
  { value: "snacks_vendus", label: "Snacks / desserts vendus à l'unité" },
];

export default function ComptaPage() {
  const {
    ingredients,
    sandwiches,
    menus,
    quantites,
    ventesParNomSandwich,
    ventesBoissons,
    ventesSnacks,
    setVente,
    setVenteBoisson,
    setVenteSnack,
    persistComptaNow,
  } = useIngredientsStore();

  const [chartType, setChartType] = useState<ChartType>("menus_par_sandwich");

  const boissons = useMemo(
    () => ingredients.filter((i) => i.categorie === "boisson"),
    [ingredients],
  );
  const snacks = useMemo(
    () => ingredients.filter((i) => i.categorie === "dessert"),
    [ingredients],
  );

  const nomsUniques = useMemo(() => {
    const seen = new Set<string>();
    return sandwiches
      .map((s) => s.nom)
      .filter((nom) => {
        if (seen.has(nom)) return false;
        seen.add(nom);
        return true;
      });
  }, [sandwiches]);

  const getCoutMenuPourSandwich = (nomSandwich: string): number => {
    const menu = menus.find((m) => m.sandwich.nom === nomSandwich);
    return menu?.coutTotal ?? 0;
  };

  const totalMenusVendus = useMemo(
    () =>
      nomsUniques.reduce(
        (acc, nom) => acc + (ventesParNomSandwich[nom] ?? 0),
        0,
      ),
    [nomsUniques, ventesParNomSandwich],
  );

  const caMenus = totalMenusVendus * PRIX_VENTE_MENU;
  const coutMenus = useMemo(
    () =>
      nomsUniques.reduce(
        (acc, nom) =>
          acc +
          (ventesParNomSandwich[nom] ?? 0) * getCoutMenuPourSandwich(nom),
        0,
      ),
    [nomsUniques, ventesParNomSandwich, menus],
  );

  const { caBoissons, coutBoissons } = useMemo(() => {
    let ca = 0;
    let cout = 0;
    boissons.forEach((ing) => {
      const qte = ventesBoissons[ing.nom] ?? 0;
      const coutUnit = coutPortion(ing, quantites.boisson);
      const prix = prixVenteUnitaire(coutUnit);
      ca += qte * prix;
      cout += qte * coutUnit;
    });
    return { caBoissons: ca, coutBoissons: cout };
  }, [boissons, ventesBoissons, quantites.boisson]);

  const { caSnacks, coutSnacks } = useMemo(() => {
    let ca = 0;
    let cout = 0;
    snacks.forEach((ing) => {
      const qte = ventesSnacks[ing.nom] ?? 0;
      const coutUnit = coutPortion(ing, quantites.dessert);
      const prix = prixVenteUnitaire(coutUnit);
      ca += qte * prix;
      cout += qte * coutUnit;
    });
    return { caSnacks: ca, coutSnacks: cout };
  }, [snacks, ventesSnacks, quantites.dessert]);

  const totalCA = caMenus + caBoissons + caSnacks;
  const totalCout = coutMenus + coutBoissons + coutSnacks;
  const benefice = totalCA - totalCout;

  const handleExportExcel = () => {
    exportComptaToExcel({
      menus,
      sandwiches,
      ingredients,
      quantites,
      ventesParNomSandwich,
      ventesBoissons,
      ventesSnacks,
    });
  };

  const chartDataMenus = useMemo(
    () => ({
      labels: nomsUniques.map((n) =>
        n.length > 25 ? n.slice(0, 22) + "…" : n,
      ),
      datasets: [
        {
          label: "Menus vendus",
          data: nomsUniques.map((nom) => ventesParNomSandwich[nom] ?? 0),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderColor: "rgb(5, 150, 105)",
          borderWidth: 1,
        },
      ],
    }),
    [nomsUniques, ventesParNomSandwich],
  );

  const chartDataCA = useMemo(
    () => ({
      labels: nomsUniques.map((n) =>
        n.length > 25 ? n.slice(0, 22) + "…" : n,
      ),
      datasets: [
        {
          label: "CA (€)",
          data: nomsUniques.map(
            (nom) => (ventesParNomSandwich[nom] ?? 0) * PRIX_VENTE_MENU,
          ),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgb(37, 99, 235)",
          borderWidth: 1,
        },
      ],
    }),
    [nomsUniques, ventesParNomSandwich],
  );

  const chartDataBenefice = useMemo(
    () => ({
      labels: nomsUniques.map((n) =>
        n.length > 25 ? n.slice(0, 22) + "…" : n,
      ),
      datasets: [
        {
          label: "Bénéfice (€)",
          data: nomsUniques.map((nom) => {
            const qte = ventesParNomSandwich[nom] ?? 0;
            const cout = getCoutMenuPourSandwich(nom);
            return Number((qte * (PRIX_VENTE_MENU - cout)).toFixed(2));
          }),
          backgroundColor: "rgba(34, 197, 94, 0.7)",
          borderColor: "rgb(22, 163, 74)",
          borderWidth: 1,
        },
      ],
    }),
    [nomsUniques, ventesParNomSandwich, menus],
  );

  const chartDataRepartition = useMemo(
    () => ({
      labels: ["Menus (5€)", "Boissons à l'unité", "Snacks à l'unité"],
      datasets: [
        {
          data: [caMenus, caBoissons, caSnacks],
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
          borderWidth: 1,
        },
      ],
    }),
    [caMenus, caBoissons, caSnacks],
  );

  const chartDataBoissons = useMemo(
    () => ({
      labels: boissons.map((b) =>
        cleanIngredientName(b.nom).length > 20
          ? cleanIngredientName(b.nom).slice(0, 17) + "…"
          : cleanIngredientName(b.nom),
      ),
      datasets: [
        {
          label: "Quantité vendue",
          data: boissons.map((b) => ventesBoissons[b.nom] ?? 0),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgb(37, 99, 235)",
          borderWidth: 1,
        },
      ],
    }),
    [boissons, ventesBoissons],
  );

  const chartDataSnacks = useMemo(
    () => ({
      labels: snacks.map((s) =>
        cleanIngredientName(s.nom).length > 20
          ? cleanIngredientName(s.nom).slice(0, 17) + "…"
          : cleanIngredientName(s.nom),
      ),
      datasets: [
        {
          label: "Quantité vendue",
          data: snacks.map((s) => ventesSnacks[s.nom] ?? 0),
          backgroundColor: "rgba(245, 158, 11, 0.7)",
          borderColor: "rgb(217, 119, 6)",
          borderWidth: 1,
        },
      ],
    }),
    [snacks, ventesSnacks],
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { raw?: unknown }) => {
              const raw = ctx.raw;
              if (typeof raw === "number" && raw % 1 !== 0) return `${raw.toFixed(2)} €`;
              return String(raw ?? "");
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    }),
    [],
  );

  const renderChart = () => {
    const empty = (
      <div className="flex h-80 items-center justify-center text-sm text-slate-500">
        Aucune donnée à afficher pour ce graphique.
      </div>
    );
    switch (chartType) {
      case "menus_par_sandwich":
        if (nomsUniques.length === 0) return empty;
        return <Bar data={chartDataMenus} options={barOptions} />;
      case "ca_par_sandwich":
        if (nomsUniques.length === 0) return empty;
        return <Bar data={chartDataCA} options={barOptions} />;
      case "benefice_par_sandwich":
        if (nomsUniques.length === 0) return empty;
        return <Bar data={chartDataBenefice} options={barOptions} />;
      case "repartition_ca":
        if (totalCA <= 0) return empty;
        return (
          <div className="h-80">
            <Doughnut
              data={chartDataRepartition}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        );
      case "boissons_vendues":
        if (boissons.length === 0) return empty;
        return <Bar data={chartDataBoissons} options={barOptions} />;
      case "snacks_vendus":
        if (snacks.length === 0) return empty;
        return <Bar data={chartDataSnacks} options={barOptions} />;
      default:
        return empty;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Comptabilité
          </h1>
          <p className="mt-2 text-stone-600">
            Menus à 5€, boissons et snacks à l&apos;unité. Les ventes sont enregistrées en direct.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportExcel}
          className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-emerald-700"
        >
          Exporter en Excel
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xl shadow-stone-900/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            CA total
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {totalCA.toFixed(2)} €
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xl shadow-stone-900/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Coûts totaux
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-stone-800">
            {totalCout.toFixed(2)} €
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xl shadow-stone-900/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Bénéfice
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {benefice.toFixed(2)} €
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xl shadow-stone-900/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Menus vendus
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-stone-900">
            {totalMenusVendus}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-stone-900">
            Graphique d&apos;analyse
          </h2>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          >
            {CHART_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="h-80">{renderChart()}</div>
      </div>

      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <h2 className="mb-3 font-heading text-lg font-bold text-stone-900">
          Saisie des ventes — Menus
        </h2>
        <p className="mb-4 text-sm text-stone-500">
          Nombre de menus (sandwich + boisson + dessert) vendus à 5€.
        </p>
        {nomsUniques.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucun sandwich. Utilisez le Générateur puis le Planificateur.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nomsUniques.map((nom) => (
              <div
                key={nom}
                className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:gap-3"
              >
                <label className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                  {nom}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={ventesParNomSandwich[nom] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setVente(nom, v === "" ? 0 : parseInt(v, 10) || 0);
                    }}
                    onBlur={() => persistComptaNow()}
                    placeholder="0"
                    className="min-h-[44px] min-w-[72px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-base font-mono text-slate-900 touch-manipulation sm:min-w-0 sm:max-w-[100px] sm:py-1.5 sm:text-sm"
                  />
                  <span className="shrink-0 text-xs text-slate-500">vendus</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Boissons vendues à l&apos;unité
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Prix = coût × 2 arrondi à 0,10 € (ex. 0,53€ → 1,10€ ; 0,49€ → 1,00€).
          </p>
          {boissons.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune boisson en base. Importez des ingrédients.
            </p>
          ) : (
            <div className="space-y-2">
              {boissons.map((ing) => {
                const coutUnit = coutPortion(ing, quantites.boisson);
                const prixVente = prixVenteUnitaire(coutUnit);
                const qte = ventesBoissons[ing.nom] ?? 0;
                return (
                  <div
                    key={ing.id}
                    className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:p-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      {cleanIngredientName(ing.nom)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {prixVente.toFixed(2)} €/u
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={qte || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setVenteBoisson(
                          ing.nom,
                          v === "" ? 0 : parseInt(v, 10) || 0,
                        );
                      }}
                      onBlur={() => persistComptaNow()}
                      placeholder="0"
                      className="min-h-[44px] min-w-[64px] max-w-[100px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-base font-mono touch-manipulation sm:min-h-0 sm:max-w-none sm:w-16 sm:rounded sm:px-1.5 sm:py-1 sm:text-sm"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Snacks / desserts vendus à l&apos;unité
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Prix = coût × 2 arrondi à 0,10 €.
          </p>
          {snacks.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun snack en base. Importez des ingrédients.
            </p>
          ) : (
            <div className="space-y-2">
              {snacks.map((ing) => {
                const coutUnit = coutPortion(ing, quantites.dessert);
                const prixVente = prixVenteUnitaire(coutUnit);
                const qte = ventesSnacks[ing.nom] ?? 0;
                return (
                  <div
                    key={ing.id}
                    className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:p-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      {cleanIngredientName(ing.nom)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {prixVente.toFixed(2)} €/u
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={qte || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setVenteSnack(
                          ing.nom,
                          v === "" ? 0 : parseInt(v, 10) || 0,
                        );
                      }}
                      onBlur={() => persistComptaNow()}
                      placeholder="0"
                      className="min-h-[44px] min-w-[64px] max-w-[100px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-base font-mono touch-manipulation sm:min-h-0 sm:max-w-none sm:w-16 sm:rounded sm:px-1.5 sm:py-1 sm:text-sm"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
