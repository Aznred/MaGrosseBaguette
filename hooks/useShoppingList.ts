"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIngredientsStore } from "@/store/ingredientsStore";
import { coutPortion } from "@/lib/pricing";
import type { Ingredient, Sandwich } from "@/lib/types";
import type { QuantitesUtilisation } from "@/lib/pricing";
import type { SandwichSelection, ShoppingItem, ShoppingUnit } from "@/lib/types/shopping";

/** Pain : 1 unité par sandwich (1 baguette) — pas dans QuantitesUtilisation */
const PAIN_UNITES_PAR_SANDWICH = 1;

interface AggregatedRow {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: ShoppingUnit;
  ingredient: Ingredient;
}

/** Étend un sandwich en lignes (ingrédient + quantité par portion × count) */
function expandSandwich(
  sandwich: Sandwich,
  count: number,
  qtes: QuantitesUtilisation
): AggregatedRow[] {
  const rows: AggregatedRow[] = [];

  rows.push({
    ingredientId: sandwich.pain.id,
    ingredientName: sandwich.pain.nom,
    quantity: PAIN_UNITES_PAR_SANDWICH * count,
    unit: "u",
    ingredient: sandwich.pain,
  });

  rows.push({
    ingredientId: sandwich.proteine.id,
    ingredientName: sandwich.proteine.nom,
    quantity: qtes.proteine * count,
    unit: "g",
    ingredient: sandwich.proteine,
  });

  if (sandwich.fromage) {
    rows.push({
      ingredientId: sandwich.fromage.id,
      ingredientName: sandwich.fromage.nom,
      quantity: qtes.fromage * count,
      unit: "g",
      ingredient: sandwich.fromage,
    });
  }
  if (sandwich.sauce) {
    rows.push({
      ingredientId: sandwich.sauce.id,
      ingredientName: sandwich.sauce.nom,
      quantity: qtes.sauce * count,
      unit: "g",
      ingredient: sandwich.sauce,
    });
  }
  (sandwich.legumes ?? []).forEach((leg) => {
    rows.push({
      ingredientId: leg.id,
      ingredientName: leg.nom,
      quantity: qtes.legumes * count,
      unit: "g",
      ingredient: leg,
    });
  });

  return rows;
}

/** Fusionne les lignes par ingrédient (somme des quantités) */
function mergeIngredients(rows: AggregatedRow[]): AggregatedRow[] {
  const byId = new Map<string, AggregatedRow>();
  for (const row of rows) {
    const existing = byId.get(row.ingredientId);
    if (existing) {
      existing.quantity += row.quantity;
    } else {
      byId.set(row.ingredientId, { ...row, quantity: row.quantity });
    }
  }
  return Array.from(byId.values());
}

export function useShoppingList() {
  const { sandwiches, quantites } = useIngredientsStore();
  const [selections, setSelections] = useState<SandwichSelection[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [stockByIngredientId, setStockByIngredientId] = useState<Record<string, number>>({});

  const setSelectionCount = useCallback((sandwichId: string, count: number) => {
    setSelections((prev) => {
      const next = prev.map((s) =>
        s.sandwichId === sandwichId ? { ...s, count: Math.max(0, Math.round(count)) } : s
      );
      return next.filter((s) => s.count > 0);
    });
  }, []);

  const setStock = useCallback((ingredientId: string, stock: number) => {
    setStockByIngredientId((prev) => ({
      ...prev,
      [ingredientId]: Math.max(0, Number(stock) || 0),
    }));
  }, []);

  const addSelection = useCallback((sandwich: Sandwich) => {
    setSelections((prev) => {
      const exists = prev.some((s) => s.sandwichId === sandwich.id);
      if (exists) return prev;
      return [...prev, { sandwichId: sandwich.id, sandwich, count: 1 }];
    });
  }, []);

  const removeSelection = useCallback((sandwichId: string) => {
    setSelections((prev) => prev.filter((s) => s.sandwichId !== sandwichId));
  }, []);

  const generateShoppingList = useCallback(() => {
    const allRows: AggregatedRow[] = [];
    for (const sel of selections) {
      if (sel.count <= 0) continue;
      allRows.push(...expandSandwich(sel.sandwich, sel.count, quantites));
    }
    const merged = mergeIngredients(allRows);

    const newItems: ShoppingItem[] = merged.map((row) => {
      const stock = stockByIngredientId[row.ingredientId] ?? 0;
      const toBuy = Math.max(0, row.quantity - stock);
      const priceEstimated = toBuy > 0 ? coutPortion(row.ingredient, toBuy) : 0;
      return {
        ingredientId: row.ingredientId,
        ingredientName: row.ingredientName,
        quantityNeeded: row.quantity,
        unit: row.unit,
        stock,
        toBuy,
        priceEstimated: Number(priceEstimated.toFixed(3)),
        ingredient: row.ingredient,
      };
    });
    setItems(newItems);
  }, [selections, quantites, stockByIngredientId]);

  // Recalculer "à acheter" et prix quand l'utilisateur modifie le stock
  useEffect(() => {
    if (items.length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        const stock = stockByIngredientId[item.ingredientId] ?? 0;
        const toBuy = Math.max(0, item.quantityNeeded - stock);
        const priceEstimated =
          toBuy > 0 ? Number(coutPortion(item.ingredient, toBuy).toFixed(3)) : 0;
        return { ...item, stock, toBuy, priceEstimated };
      })
    );
  }, [stockByIngredientId]);

  const totalEstimated = useMemo(
    () => items.reduce((sum, i) => sum + i.priceEstimated, 0),
    [items]
  );

  return {
    selections,
    items,
    totalEstimated,
    setSelectionCount,
    setStock,
    generateShoppingList,
    addSelection,
    removeSelection,
    sandwiches,
  };
}
