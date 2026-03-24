"use client";

import { useEffect, useRef } from "react";
import { useIngredientsStore } from "@/store/ingredientsStore";
import type { PersistPayload } from "@/lib/persistTypes";
import type { MetroProductRecord } from "@/lib/metroProductsDb";

export function PersistLoader() {
  const hydrate = useIngredientsStore((s) => s.hydrate);
  const addIngredients = useIngredientsStore((s) => s.addIngredients);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    Promise.all([
      fetch("/api/persist").then((r) => r.json()) as Promise<PersistPayload>,
      fetch("/api/persist/compta").then((r) => r.json()).catch(() => null),
    ]).then(([data, compta]) => {
      if (compta && typeof compta === "object" && !("error" in compta)) {
        data = {
          ...data,
          ventesParNomSandwich: (compta as { ventesParNomSandwich?: Record<string, number> }).ventesParNomSandwich ?? data.ventesParNomSandwich,
          ventesBoissons: (compta as { ventesBoissons?: Record<string, number> }).ventesBoissons ?? data.ventesBoissons,
          ventesSnacks: (compta as { ventesSnacks?: Record<string, number> }).ventesSnacks ?? data.ventesSnacks,
        };
      }
      const hasIngredients = (data.ingredients?.length ?? 0) > 0;
      const hasCustomSandwiches = (data.customSandwiches?.length ?? 0) > 0;
      const hasVentes =
        (data.ventesParNomSandwich && Object.keys(data.ventesParNomSandwich).length > 0) ||
        (data.ventesBoissons && Object.keys(data.ventesBoissons).length > 0) ||
        (data.ventesSnacks && Object.keys(data.ventesSnacks).length > 0);
      if (hasIngredients || hasCustomSandwiches || hasVentes) {
        hydrate(data);
      } else {
        // Aucune donnée persistée : charger le catalogue Metro par défaut
        fetch("/api/metro-products?limit=500")
          .then((r) => r.json())
          .then((products: MetroProductRecord[]) => {
            if (Array.isArray(products) && products.length > 0) {
              addIngredients(products);
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});
  }, [hydrate, addIngredients]);

  return null;
}
