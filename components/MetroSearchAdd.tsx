"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIngredientsStore } from "@/store/ingredientsStore";
import { parseMetroContentToIngredients } from "@/lib/metroParse";
import type { Ingredient } from "@/lib/types";

const METRO_SEARCH_URL_KEY = "metro-search-url";

export function MetroSearchAdd() {
  const addIngredients = useIngredientsStore((s) => s.addIngredients);
  const existingNames = useIngredientsStore((s) => s.ingredients.map((i) => i.nom.toLowerCase()));

  const [url, setUrl] = useState("");
  const [products, setProducts] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(METRO_SEARCH_URL_KEY);
      if (saved) setUrl(saved);
    }
  }, []);

  const loadList = useCallback(async () => {
    const savedUrl = typeof window !== "undefined" ? localStorage.getItem(METRO_SEARCH_URL_KEY) : null;
    const fetchUrl = url.trim() || savedUrl || "";
    if (!fetchUrl) {
      setError("Indiquez l'URL du CSV ou de la page METRO.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/import-metro?url=${encodeURIComponent(fetchUrl)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors du chargement METRO");
        return;
      }
      const content = typeof data.content === "string" ? data.content : "";
      if (!content) {
        setError("Réponse vide.");
        return;
      }
      const list = await parseMetroContentToIngredients(content);
      setProducts(list);
      setLoaded(true);
      if (fetchUrl && typeof window !== "undefined") {
        localStorage.setItem(METRO_SEARCH_URL_KEY, fetchUrl);
      }
    } catch {
      setError("Impossible de récupérer la liste METRO");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 50);
    return products.filter((p) => p.nom.toLowerCase().includes(q)).slice(0, 30);
  }, [products, search]);

  const addOne = useCallback(
    (ing: Ingredient) => {
      const newIng: Ingredient = {
        ...ing,
        id: `metro-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      addIngredients([newIng]);
    },
    [addIngredients]
  );

  const alreadyAdded = useCallback(
    (nom: string) => existingNames.includes(nom.toLowerCase()),
    [existingNames]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span role="img" aria-hidden>🔍</span>
        Ajouter un ingrédient en recherchant dans la liste METRO
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Chargez une fois la liste METRO (URL de votre export ou page), puis recherchez par nom et ajoutez les produits à vos ingrédients.
      </p>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            placeholder="URL du CSV ou page METRO"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={loadList}
            disabled={loading}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {loading ? "Chargement…" : "Charger la liste"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loaded && products.length > 0 && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">Rechercher par nom</span>
              <input
                type="text"
                placeholder="Ex: jambon, cristaline, pompes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <p className="text-xs text-slate-500">
              {filtered.length} résultat(s) — cliquez sur « Ajouter » pour l&apos;ajouter à vos ingrédients
            </p>
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-2">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{p.nom}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {p.prixTotal.toFixed(2)} € / {p.poidsTotal} {p.modeTarif === "gramme" ? "g" : "u"}
                  </span>
                  <button
                    type="button"
                    onClick={() => addOne(p)}
                    disabled={alreadyAdded(p.nom)}
                    className="shrink-0 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {alreadyAdded(p.nom) ? "Déjà ajouté" : "Ajouter"}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {loaded && products.length === 0 && (
          <p className="text-sm text-slate-500">Aucun produit trouvé dans le fichier.</p>
        )}
      </div>
    </div>
  );
}
