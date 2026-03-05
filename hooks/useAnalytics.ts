"use client";

import { useCallback, useMemo } from "react";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { useIngredientsStore } from "@/store/ingredientsStore";
import type {
  MenuOrder,
  NameStat,
  TopMenuCombo,
  ProductionRecommendation,
  MenuRentability,
} from "@/lib/types/analytics";
import type { Menu } from "@/lib/types";

const PRIX_VENTE_MENU_DEFAUT = 5;

function aggregateByName(
  orders: MenuOrder[],
  getKey: (o: MenuOrder) => string
): NameStat[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    const q = o.quantity || 1;
    const key = getKey(o);
    map.set(key, (map.get(key) ?? 0) + q);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function getTopCombos(orders: MenuOrder[], limit: number): TopMenuCombo[] {
  const map = new Map<string, { sandwich: string; boisson: string; dessert: string; count: number }>();
  for (const o of orders) {
    const key = `${o.sandwich}|${o.boisson}|${o.dessert}`;
    const prev = map.get(key);
    const q = o.quantity || 1;
    if (prev) prev.count += q;
    else map.set(key, { sandwich: o.sandwich, boisson: o.boisson, dessert: o.dessert, count: q });
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((c) => ({
      ...c,
      label: `${c.sandwich} + ${c.boisson} + ${c.dessert}`,
    }));
}

export function useAnalytics() {
  const { menuOrders } = useAnalyticsStore();
  const { menus } = useIngredientsStore();

  const getSandwichStats = useMemo((): NameStat[] => {
    return aggregateByName(menuOrders, (o) => o.sandwich);
  }, [menuOrders]);

  const getDrinkStats = useMemo((): NameStat[] => {
    return aggregateByName(menuOrders, (o) => o.boisson);
  }, [menuOrders]);

  const getDessertStats = useMemo((): NameStat[] => {
    return aggregateByName(menuOrders, (o) => o.dessert);
  }, [menuOrders]);

  const getTopMenus = useCallback(
    (limit = 10): TopMenuCombo[] => getTopCombos(menuOrders, limit),
    [menuOrders]
  );

  const totalOrders = useMemo(
    () => menuOrders.reduce((acc, o) => acc + (o.quantity || 1), 0),
    [menuOrders]
  );

  const generateProductionRecommendation = useMemo((): ProductionRecommendation => {
    const sandwiches = getSandwichStats.slice(0, 15).map((s) => ({ name: s.name, quantity: s.count }));
    const boissons = getDrinkStats.slice(0, 10).map((b) => ({ name: b.name, quantity: b.count }));
    const desserts = getDessertStats.slice(0, 10).map((d) => ({ name: d.name, quantity: d.count }));
    return { sandwiches, boissons, desserts };
  }, [getSandwichStats, getDrinkStats, getDessertStats]);

  /** Menus les plus rentables (marge = prix vente - coût), basé sur les menus du store */
  const getMenusRentability = useMemo(
    (prixVente = PRIX_VENTE_MENU_DEFAUT): MenuRentability[] => {
      return menus.map((m) => ({
        label: `${m.sandwich.nom} + ${m.boisson.nom} + ${m.dessert.nom}`,
        sandwich: m.sandwich.nom,
        boisson: m.boisson.nom,
        dessert: m.dessert.nom,
        cost: m.coutTotal,
        margeEstimee: Number((prixVente - m.coutTotal).toFixed(2)),
      })).sort((a, b) => b.margeEstimee - a.margeEstimee);
    },
    [menus]
  );

  const costMoyenMenu = useMemo(() => {
    if (menus.length === 0) return 0;
    const sum = menus.reduce((acc, m) => acc + m.coutTotal, 0);
    return Number((sum / menus.length).toFixed(3));
  }, [menus]);

  /**
   * Simulation semaine : pour un nombre de clients estimé, calcule les quantités à préparer
   * en proportion des ventes passées.
   */
  const simulateWeek = useMemo(
    () =>
      (clientsEstimes: number): ProductionRecommendation => {
        if (totalOrders <= 0 || !Number.isFinite(clientsEstimes) || clientsEstimes <= 0) {
          return {
            sandwiches: getSandwichStats.map((s) => ({ name: s.name, quantity: 0 })),
            boissons: getDrinkStats.map((b) => ({ name: b.name, quantity: 0 })),
            desserts: getDessertStats.map((d) => ({ name: d.name, quantity: 0 })),
          };
        }
        const ratio = clientsEstimes / totalOrders;
        return {
          sandwiches: getSandwichStats.map((s) => ({
            name: s.name,
            quantity: Math.round(s.count * ratio),
          })),
          boissons: getDrinkStats.map((b) => ({
            name: b.name,
            quantity: Math.round(b.count * ratio),
          })),
          desserts: getDessertStats.map((d) => ({
            name: d.name,
            quantity: Math.round(d.count * ratio),
          })),
        };
      },
    [totalOrders, getSandwichStats, getDrinkStats, getDessertStats]
  );

  return {
    menuOrders,
    totalOrders,
    getSandwichStats,
    getDrinkStats,
    getDessertStats,
    getTopMenus,
    generateProductionRecommendation,
    getMenusRentability,
    costMoyenMenu,
    simulateWeek,
  };
}
