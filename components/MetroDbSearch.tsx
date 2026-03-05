"use client";

import { useCallback, useEffect, useState } from "react";
import { useIngredientsStore } from "@/store/ingredientsStore";
import type { Ingredient } from "@/lib/types";

export function MetroDbSearch() {
  const addIngredients = useIngredientsStore((s) => s.addIngredients);
  const existingNames = useIngredientsStore((s) => s.ingredients.map((i) => i.nom.toLowerCase()));

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const search = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/metro-products?q=${encodeURIComponent(q)}&limit=30`
      );
      if (!res.ok) throw new Error("Recherche impossible");
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setError("Erreur lors de la recherche.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) search(query.trim());
      else setResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [query, search]);

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
        <span role="img" aria-hidden>🛒</span>
        Produits Metro (base locale)
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Recherchez un produit alimentaire Metro (Séquières Toulouse) et ajoutez-le à vos ingrédients.
      </p>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Rechercher par nom</span>
          <input
            type="text"
            placeholder="Ex: jambon, mozzarella, baguette..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-slate-500">Recherche…</p>}
        {!loading && query.trim() && (
          <p className="text-xs text-slate-500">
            {results.length} résultat(s) — cliquez sur « Ajouter » pour l&apos;ajouter à vos ingrédients
          </p>
        )}
        {!loading && results.length > 0 && (
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            {results.map((p) => (
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
        )}
        {!loading && query.trim() && results.length === 0 && (
          <p className="text-sm text-slate-500">Aucun produit trouvé dans la base.</p>
        )}
        <details className="mt-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-600">
            Remplir la base Metro (importer depuis une URL)
          </summary>
          <MetroDbSeedForm onSeeded={() => query.trim() && search(query.trim())} />
        </details>
      </div>
    </div>
  );
}

function MetroDbSeedForm({ onSeeded }: { onSeeded?: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const u = url.trim();
    if (!u) {
      setMessage("Indiquez l'URL du CSV ou de la page Metro.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/metro-products/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Erreur lors de l'import.");
        return;
      }
      setMessage(`Import réussi : ${data.count ?? 0} produit(s) en base.`);
      setUrl("");
      onSeeded?.();
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [url, onSeeded]);

  return (
    <div className="mt-2 space-y-2">
      <input
        type="url"
        placeholder="URL du CSV ou page Metro"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Import…" : "Importer dans la base"}
      </button>
      {message && (
        <p className={`text-xs ${message.startsWith("Import réussi") ? "text-emerald-600" : "text-amber-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
