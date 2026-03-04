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
        if (data.ingredients?.length || data.customSandwiches?.length) {
          hydrate(data);
        }
      })
      .catch(() => {});
  }, [hydrate]);

  return null;
}
