import { create } from "zustand";
import type { Ingredient, Menu, Sandwich } from "@/lib/types";
import { genererMenus, genererSandwichs, sandwichSignature } from "@/lib/generator";
import {
  calculerCoutSandwich,
  QUANTITES_PAR_DEFAUT,
  type QuantitesUtilisation,
} from "@/lib/pricing";
import type { PersistPayload } from "@/lib/persistTypes";
import { NOMS_SANDWICHS_PAR_DEFAUT } from "@/lib/persistTypes";

interface IngredientsState {
  ingredients: Ingredient[];
  sandwiches: Sandwich[];
  customSandwiches: Sandwich[];
  menus: Menu[];
  quantites: QuantitesUtilisation;
  sandwichNames: string[];
  ventesParNomSandwich: Record<string, number>;
  ventesBoissons: Record<string, number>;
  ventesSnacks: Record<string, number>;
  removedAutoSignatures: string[];
  vegetarienOnly: boolean;
  veganLegumes: boolean;
  sansFromage: boolean;
  sansSauce: boolean;
  setVegetarienOnly: (value: boolean) => void;
  setVeganLegumes: (value: boolean) => void;
  setSansFromage: (value: boolean) => void;
  setSansSauce: (value: boolean) => void;
  setQuantite: (key: keyof QuantitesUtilisation, value: number) => void;
  setSandwichNames: (names: string[]) => void;
  setVente: (nomSandwich: string, quantite: number) => void;
  setVenteBoisson: (nomIngredient: string, quantite: number) => void;
  setVenteSnack: (nomIngredient: string, quantite: number) => void;
  addIngredients: (items: Ingredient[]) => void;
  generate: () => void;
  addCustomSandwich: (payload: Omit<Sandwich, "id" | "cout">) => void;
  toggleFavori: (menuId: string) => void;
  hydrate: (data: PersistPayload) => void;
  persist: () => Promise<boolean>;
  removeCustomSandwich: (sandwichId: string) => void;
  removeAutoSandwich: (sandwich: Sandwich) => void;
}

export const useIngredientsStore = create<IngredientsState>((set, get) => ({
  ingredients: [],
  sandwiches: [],
  customSandwiches: [],
  menus: [],
  quantites: QUANTITES_PAR_DEFAUT,
  sandwichNames: NOMS_SANDWICHS_PAR_DEFAUT,
  ventesParNomSandwich: {},
  ventesBoissons: {},
  ventesSnacks: {},
  removedAutoSignatures: [],
  vegetarienOnly: false,
  veganLegumes: false,
  sansFromage: false,
  sansSauce: false,
  setVegetarienOnly: (value) => set({ vegetarienOnly: value }),
  setVeganLegumes: (value) => set({ veganLegumes: value }),
  setSansFromage: (value) => set({ sansFromage: value }),
  setSansSauce: (value) => set({ sansSauce: value }),
  setVente: (nomSandwich, quantite) => {
    set((state) => ({
      ventesParNomSandwich: {
        ...state.ventesParNomSandwich,
        [nomSandwich]: Math.max(0, Math.round(quantite)),
      },
    }));
    get().persist();
  },
  setVenteBoisson: (nomIngredient, quantite) => {
    set((state) => ({
      ventesBoissons: {
        ...state.ventesBoissons,
        [nomIngredient]: Math.max(0, Math.round(quantite)),
      },
    }));
    get().persist();
  },
  setVenteSnack: (nomIngredient, quantite) => {
    set((state) => ({
      ventesSnacks: {
        ...state.ventesSnacks,
        [nomIngredient]: Math.max(0, Math.round(quantite)),
      },
    }));
    get().persist();
  },
  setSandwichNames: (names) => {
    set({ sandwichNames: names.length ? names : NOMS_SANDWICHS_PAR_DEFAUT });
    get().persist();
  },
  setQuantite: (key, value) => {
    set((state) => ({
      quantites: {
        ...state.quantites,
        [key]: Number.isFinite(value) && value > 0 ? value : 0.001,
      },
    }));
    get().persist();
  },
  addIngredients: (items) => {
    set((state) => {
      const existing = state.ingredients;
      const norm = (n: string) => n.trim().toLowerCase();
      const toAdd = items.filter(
        (ni) =>
          !existing.some(
            (e) =>
              norm(e.nom) === norm(ni.nom) && e.categorie === ni.categorie,
          ),
      );
      return { ingredients: [...state.ingredients, ...toAdd] };
    });
    get().persist();
  },
  generate: () => {
    const { ingredients, vegetarienOnly, veganLegumes, sansFromage, sansSauce, quantites, customSandwiches, sandwichNames, removedAutoSignatures } = get();
    if (!ingredients.length) return;
    const excluded = new Set(removedAutoSignatures);
    const autoRaw = genererSandwichs(ingredients, {
      vegetarienOnly,
      veganLegumes,
      sansFromage,
      sansSauce,
      quantites,
      sandwichNames,
      count: 25,
    });
    const autoSandwiches = autoRaw.filter((s) => !excluded.has(sandwichSignature(s)));
    const customRecalcules = customSandwiches.map((s) => ({
      ...s,
      cout: calculerCoutSandwich(s, quantites),
    }));
    const sandwiches = [...autoSandwiches, ...customRecalcules];
    const menus = genererMenus(sandwiches, ingredients, quantites);
    set({ sandwiches, menus });
  },
  addCustomSandwich: (payload) => {
    set((state) => {
      const sandwichBase = {
        ...payload,
        id: "custom-preview",
      };
      const sandwich: Sandwich = {
        ...payload,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        cout: calculerCoutSandwich(sandwichBase, state.quantites),
      };
      const customSandwiches = [...state.customSandwiches, sandwich];
      const sandwiches = [...state.sandwiches, sandwich];
      const menus = genererMenus(sandwiches, state.ingredients, state.quantites);
      return { customSandwiches, sandwiches, menus };
    });
    get().persist();
  },
  toggleFavori: (menuId) =>
    set((state) => ({
      menus: state.menus.map((m) =>
        m.id === menuId ? { ...m, favori: !m.favori } : m,
      ),
    })),
  removeCustomSandwich: (sandwichId) => {
    set((state) => {
      const customSandwiches = state.customSandwiches.filter(
        (s) => s.id !== sandwichId,
      );
      const sandwiches = [
        ...state.sandwiches.filter((s) => s.id !== sandwichId),
      ];
      const menus = genererMenus(
        sandwiches,
        state.ingredients,
        state.quantites,
      );
      return { customSandwiches, sandwiches, menus };
    });
    get().persist();
  },
  removeAutoSandwich: (sandwich) => {
    const sig = sandwichSignature(sandwich);
    set((state) => {
      const removedAutoSignatures = state.removedAutoSignatures.includes(sig)
        ? state.removedAutoSignatures
        : [...state.removedAutoSignatures, sig];
      const sandwiches = state.sandwiches.filter((s) => s.id !== sandwich.id);
      const menus = genererMenus(
        sandwiches,
        state.ingredients,
        state.quantites,
      );
      return { removedAutoSignatures, sandwiches, menus };
    });
    get().persist();
  },
  hydrate: (data) => {
    set({
      ingredients: data.ingredients ?? [],
      customSandwiches: data.customSandwiches ?? [],
      quantites: { ...QUANTITES_PAR_DEFAUT, ...data.quantites },
      sandwichNames:
        Array.isArray(data.sandwichNames) && data.sandwichNames.length > 0
          ? data.sandwichNames
          : NOMS_SANDWICHS_PAR_DEFAUT,
      ventesParNomSandwich: data.ventesParNomSandwich ?? {},
      ventesBoissons: data.ventesBoissons ?? {},
      ventesSnacks: data.ventesSnacks ?? {},
      removedAutoSignatures: data.removedAutoSignatures ?? [],
    });
    get().generate();
  },
  persist: () => {
    const state = get();
    return fetch("/api/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: state.ingredients,
        customSandwiches: state.customSandwiches,
        quantites: state.quantites,
        sandwichNames: state.sandwichNames,
        ventesParNomSandwich: state.ventesParNomSandwich,
        ventesBoissons: state.ventesBoissons,
        ventesSnacks: state.ventesSnacks,
        removedAutoSignatures: state.removedAutoSignatures,
      }),
    })
      .then((r) => r.ok)
      .catch(() => false);
  },
}));

