"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { useIngredientsStore } from "@/store/ingredientsStore";
import { exportAnalyticsReportCsv, printAnalyticsReportPdf } from "@/lib/analyticsExport";

const CHART_COLORS = [
  "#0d9488",
  "#059669",
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#14b8a6",
  "#2dd4bf",
  "#5eead4",
  "#99f6e4",
  "#ccfbf1",
];

export default function AnalyticsPage() {
  const {
    totalOrders,
    getSandwichStats,
    getDrinkStats,
    getDessertStats,
    getTopMenus,
    generateProductionRecommendation,
    getMenusRentability,
    costMoyenMenu,
    simulateWeek,
  } = useAnalytics();
  const { menuOrders, addMenuOrder, addMenuOrders, clearOrders } = useAnalyticsStore();
  const { menus, sandwiches, ventesParNomSandwich } = useIngredientsStore();

  const [simulationClients, setSimulationClients] = useState<string>("200");
  const [addSandwich, setAddSandwich] = useState("");
  const [addBoisson, setAddBoisson] = useState("");
  const [addDessert, setAddDessert] = useState("");
  const [addQty, setAddQty] = useState("1");

  const sandwichNames = useMemo(
    () => [...new Set(sandwiches.map((s) => s.nom))],
    [sandwiches]
  );
  const boissonNames = useMemo(
    () => [...new Set(menus.map((m) => m.boisson.nom))],
    [menus]
  );
  const dessertNames = useMemo(
    () => [...new Set(menus.map((m) => m.dessert.nom))],
    [menus]
  );

  const recommendation = generateProductionRecommendation;
  const rentability = getMenusRentability;
  const topMenus = getTopMenus(15);

  const simulationResult = useMemo(() => {
    const n = parseInt(simulationClients, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return simulateWeek(n);
  }, [simulationClients, simulateWeek]);

  const handleImportFromCompta = () => {
    const orders: { sandwich: string; boisson: string; dessert: string; quantity: number }[] = [];
    for (const [nomSandwich, count] of Object.entries(ventesParNomSandwich)) {
      if (!count || count <= 0) continue;
      const menu = menus.find((m) => m.sandwich.nom === nomSandwich);
      if (menu) {
        orders.push({
          sandwich: nomSandwich,
          boisson: menu.boisson.nom,
          dessert: menu.dessert.nom,
          quantity: count,
        });
      }
    }
    if (orders.length > 0) addMenuOrders(orders);
  };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSandwich || !addBoisson || !addDessert) return;
    const qty = parseInt(addQty, 10) || 1;
    addMenuOrder({
      sandwich: addSandwich,
      boisson: addBoisson,
      dessert: addDessert,
      quantity: qty,
    });
    setAddQty("1");
  };

  const sandwichData = useMemo(
    () => getSandwichStats.map((s) => ({ name: s.name, count: s.count })),
    [getSandwichStats]
  );
  const drinkData = useMemo(
    () => getDrinkStats.map((s) => ({ name: s.name, value: s.count })),
    [getDrinkStats]
  );
  const dessertData = useMemo(
    () => getDessertStats.map((s) => ({ name: s.name, value: s.count })),
    [getDessertStats]
  );

  const handleExportCsv = () => {
    exportAnalyticsReportCsv(
      getSandwichStats,
      getDrinkStats,
      getDessertStats,
      topMenus,
      recommendation,
      rentability,
      totalOrders,
      costMoyenMenu
    );
  };
  const handleExportPdf = () => {
    printAnalyticsReportPdf(
      getSandwichStats,
      getDrinkStats,
      getDessertStats,
      topMenus,
      recommendation,
      rentability,
      totalOrders,
      costMoyenMenu
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Analyste
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Analyse des menus sélectionnés, popularité et recommandations de production.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Exporter rapport CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Exporter rapport PDF
          </button>
        </div>
      </header>

      {/* Historique : enregistrer une vente / importer compta */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Historique des menus
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          {totalOrders} commande(s) enregistrée(s). Enregistrez des ventes menu (sandwich + boisson + dessert) pour alimenter les statistiques.
        </p>
        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleAddOrder} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Sandwich</label>
              <select
                value={addSandwich}
                onChange={(e) => setAddSandwich(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Choisir…</option>
                {sandwichNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Boisson</label>
              <select
                value={addBoisson}
                onChange={(e) => setAddBoisson(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Choisir…</option>
                {boissonNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Dessert</label>
              <select
                value={addDessert}
                onChange={(e) => setAddDessert(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Choisir…</option>
                {dessertNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Qté</label>
              <input
                type="number"
                min={1}
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Enregistrer
            </button>
          </form>
          <button
            type="button"
            onClick={handleImportFromCompta}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Importer depuis la compta
          </button>
          {menuOrders.length > 0 && (
            <button
              type="button"
              onClick={() => clearOrders()}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Effacer l&apos;historique
            </button>
          )}
        </div>
      </section>

      {/* Simulation semaine */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Simulation semaine
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Nombre de clients estimés : le système calcule les quantités à préparer en proportion des ventes passées.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            value={simulationClients}
            onChange={(e) => setSimulationClients(e.target.value)}
            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <span className="text-sm text-slate-600">menus / semaine</span>
        </div>
        {simulationResult && totalOrders > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Sandwichs à préparer</p>
              <ul className="list-inside list-disc text-sm text-slate-700">
                {simulationResult.sandwiches
                  .filter((s) => s.quantity > 0)
                  .slice(0, 8)
                  .map((s) => (
                    <li key={s.name}>{s.name} → {s.quantity}</li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Boissons</p>
              <ul className="list-inside list-disc text-sm text-slate-700">
                {simulationResult.boissons
                  .filter((b) => b.quantity > 0)
                  .slice(0, 6)
                  .map((b) => (
                    <li key={b.name}>{b.name} → {b.quantity}</li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Desserts</p>
              <ul className="list-inside list-disc text-sm text-slate-700">
                {simulationResult.desserts
                  .filter((d) => d.quantity > 0)
                  .slice(0, 6)
                  .map((d) => (
                    <li key={d.name}>{d.name} → {d.quantity}</li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Statistiques sandwichs - Bar chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Sandwichs populaires
        </h2>
        {sandwichData.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune donnée. Enregistrez des ventes ou importez depuis la compta.</p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sandwichData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" name="Quantité" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Boissons + Desserts - Pie charts côte à côte */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Boissons les plus choisies
          </h2>
          {drinkData.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune donnée.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={drinkData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {drinkData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Desserts les plus utilisés
          </h2>
          {dessertData.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune donnée.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dessertData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {dessertData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Top menus - Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Top menus (combinaisons)
        </h2>
        {topMenus.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune combinaison enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-2 pr-4">Sandwich + Boisson + Dessert</th>
                  <th className="py-2">Quantité</th>
                </tr>
              </thead>
              <tbody>
                {topMenus.map((t) => (
                  <tr key={t.label} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{t.label}</td>
                    <td className="py-2 text-slate-600">{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recommandation production */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Recommandation production (basée sur l&apos;historique)
        </h2>
        {totalOrders === 0 ? (
          <p className="text-sm text-slate-500">Enregistrez des ventes pour obtenir une recommandation.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Sandwichs</p>
              <ul className="space-y-1 text-sm text-slate-700">
                {recommendation.sandwiches.slice(0, 10).map((s) => (
                  <li key={s.name}>{s.name} → {s.quantity}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Boissons</p>
              <ul className="space-y-1 text-sm text-slate-700">
                {recommendation.boissons.slice(0, 8).map((b) => (
                  <li key={b.name}>{b.name} → {b.quantity}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Desserts</p>
              <ul className="space-y-1 text-sm text-slate-700">
                {recommendation.desserts.slice(0, 8).map((d) => (
                  <li key={d.name}>{d.name} → {d.quantity}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Rentabilité */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Analyse rentabilité
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Coût moyen d&apos;un menu : <strong>{costMoyenMenu.toFixed(2)} €</strong> (prix de vente supposé 5 € pour la marge).
        </p>
        {rentability.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun menu en base.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-2 pr-4">Menu</th>
                  <th className="py-2">Coût</th>
                  <th className="py-2">Marge estimée</th>
                </tr>
              </thead>
              <tbody>
                {rentability.slice(0, 15).map((r) => (
                  <tr key={r.label} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-800">{r.label}</td>
                    <td className="py-2 text-slate-600">{r.cost.toFixed(2)} €</td>
                    <td className="py-2 font-medium text-emerald-700">{r.margeEstimee.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
