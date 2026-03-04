"use client";

import { useEffect, useRef } from "react";
import { useIngredientsStore } from "@/store/ingredientsStore";
import type { PersistPayload } from "@/lib/persistTypes";

export function PersistLoader() {
  const hydrate = useIngredientsStore((s) => s.hydrate);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    fetch("/api/persist")
      .then((r) => r.json())
      .then((data: PersistPayload) => {
        const hasIngredients = (data.ingredients?.length ?? 0) > 0;
        const hasCustomSandwiches = (data.customSandwiches?.length ?? 0) > 0;
        const hasVentes =
          (data.ventesParNomSandwich && Object.keys(data.ventesParNomSandwich).length > 0) ||
          (data.ventesBoissons && Object.keys(data.ventesBoissons).length > 0) ||
          (data.ventesSnacks && Object.keys(data.ventesSnacks).length > 0);
        if (hasIngredients || hasCustomSandwiches || hasVentes) {
          hydrate(data);
        }
      })
      .catch(() => {});
  }, [hydrate]);

  return null;
}
