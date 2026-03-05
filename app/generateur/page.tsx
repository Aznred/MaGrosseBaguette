 "use client";

import { useMemo, useState } from "react";
import { SandwichVisualCard } from "@/components/SandwichVisualCard";
import { SandwichDetailModal } from "@/components/SandwichDetailModal";
import { getCategoryIcon } from "@/components/CategoryIcon";
import type { Ingredient, Sandwich } from "@/lib/types";
import type { QuantitesUtilisation } from "@/lib/pricing";
import { useIngredientsStore } from "@/store/ingredientsStore";
import { cleanIngredientName } from "@/lib/ingredientName";

const FIELDS: Array<{
  key: keyof QuantitesUtilisation;
  label: string;
  unit: string;
}> = [
  { key: "proteine", label: "Protéine", unit: "g" },
  { key: "fromage", label: "Fromage", unit: "g" },
  { key: "sauce", label: "Sauce", unit: "g" },
  { key: "legumes", label: "Légumes (par ingrédient)", unit: "g" },
  { key: "boisson", label: "Boisson (par menu)", unit: "u" },
  { key: "dessert", label: "Dessert (par menu)", unit: "u" },
  { key: "emballage", label: "Emballage (par article)", unit: "u" },
];

export default function GenerateurPage() {
  const {
    ingredients,
    sandwiches,
    customSandwiches,
    quantites,
    setQuantite,
    generate,
    addCustomSandwich,
    removeCustomSandwich,
  } = useIngredientsStore();

  const pains = ingredients.filter((i) => i.categorie === "pain");
  const proteines = ingredients.filter(
    (i) =>
      i.categorie === "viande" || i.categorie === "proteine_vegetarienne",
  );
  const fromages = ingredients.filter((i) => i.categorie === "fromage");
  const sauces = ingredients.filter((i) => i.categorie === "sauce");
  const legumes = ingredients.filter((i) => i.categorie === "legumes");

  const [painId, setPainId] = useState("");
  const [proteineId, setProteineId] = useState("");
  const [fromageId, setFromageId] = useState("");
  const [sauceId, setSauceId] = useState("");
  const [selectedLegumes, setSelectedLegumes] = useState<string[]>([]);
  const [customSandwichName, setCustomSandwichName] = useState("");

  const [search, setSearch] = useState("");
  const [maxCout, setMaxCout] = useState<number | null>(null);
  const [avecLegumesOnly, setAvecLegumesOnly] = useState(false);
  const [detailSandwich, setDetailSandwich] = useState<Sandwich | null>(null);

  const sandwichesFiltres = useMemo(() => {
    return sandwiches
      .filter((s) => {
        if (maxCout !== null && s.cout > maxCout) return false;
        if (avecLegumesOnly) {
          const aDesLegumes =
            (s.legumes && s.legumes.length > 0) ||
            s.proteine.categorie === "legumes";
          if (!aDesLegumes) return false;
        }
        if (!search.trim()) return true;
        return s.nom.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => a.cout - b.cout);
  }, [sandwiches, maxCout, avecLegumesOnly, search]);

  const toggleLegume = (id: string) => {
    setSelectedLegumes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addRecipe = () => {
    const pain = pains.find((i) => i.id === painId);
    const legumeIngredients: Ingredient[] = legumes.filter((l) =>
      selectedLegumes.includes(l.id),
    );
    const proteineChoisie = proteineId
      ? proteines.find((i) => i.id === proteineId)
      : null;
    const fromage = fromageId ? fromages.find((i) => i.id === fromageId) : undefined;
    const sauce = sauceId ? sauces.find((i) => i.id === sauceId) : undefined;

    const proteine =
      proteineChoisie ??
      (legumeIngredients.length > 0 ? legumeIngredients[0] : null);
    const legumesRestants = proteineChoisie
      ? legumeIngredients
      : legumeIngredients.length <= 1
        ? []
        : legumeIngredients.slice(1);
    if (!pain || !proteine) return;

    const nomAuto = [
      cleanIngredientName(proteine.nom),
      fromage ? cleanIngredientName(fromage.nom) : null,
      sauce ? cleanIngredientName(sauce.nom) : null,
      ...legumesRestants.map((l) => cleanIngredientName(l.nom)),
    ].filter(Boolean).join(" / ");
    const nom = customSandwichName.trim() || `Recette perso - ${nomAuto}`;

    addCustomSandwich({
      nom,
      pain,
      proteine,
      ...(fromage && { fromage }),
      ...(sauce && { sauce }),
      legumes: legumesRestants.length ? legumesRestants : undefined,
    });
    setCustomSandwichName("");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Générateur de sandwichs
        </h1>
        <p className="mt-2 text-stone-600">
          Ajustez les quantités par sandwich. Le pain est fixe à 0,50€.
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {ingredients.length} ingrédients · {sandwiches.length} recette{sandwiches.length !== 1 ? "s" : ""}
        </p>
      </header>

      <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <h2 className="mb-4 font-heading text-lg font-bold text-stone-900">
          Paramètres de consommation (mode réel)
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FIELDS.map((field) => (
            <label
              key={field.key}
              className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-4"
            >
              <div className="mb-2 text-sm font-medium text-stone-700">{field.label}</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.001}
                  step={0.1}
                  value={quantites[field.key]}
                  onChange={(e) =>
                    setQuantite(field.key, parseFloat(e.target.value || "0"))
                  }
                  className="w-full flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-900 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
                <span className="shrink-0 text-sm text-stone-500">{field.unit}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-5">
          <button
            type="button"
            onClick={generate}
            className="min-h-[44px] w-full touch-manipulation rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-emerald-700 sm:w-auto sm:py-2.5"
          >
            Recalculer les coûts
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <h2 className="mb-4 font-heading text-lg font-bold text-stone-900">
          Créer ma recette
        </h2>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            Nom du sandwich (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex: Mon club préféré"
            value={customSandwichName}
            onChange={(e) => setCustomSandwichName(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-800 placeholder:text-stone-400 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={painId}
            onChange={(e) => setPainId(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-800 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          >
            <option value="">Choisir un pain</option>
            {pains.map((p) => (
              <option key={p.id} value={p.id}>
                {cleanIngredientName(p.nom)}
              </option>
            ))}
          </select>
          <select
            value={proteineId}
            onChange={(e) => setProteineId(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-800 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          >
            <option value="">Sans viande (légumes ci‑dessous)</option>
            {proteines.map((p) => (
              <option key={p.id} value={p.id}>
                {cleanIngredientName(p.nom)}
              </option>
            ))}
          </select>
          <select
            value={fromageId}
            onChange={(e) => setFromageId(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-800 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          >
            <option value="">Sans fromage (optionnel)</option>
            {fromages.map((f) => (
              <option key={f.id} value={f.id}>
                {cleanIngredientName(f.nom)}
              </option>
            ))}
          </select>
          <select
            value={sauceId}
            onChange={(e) => setSauceId(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-800 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          >
            <option value="">Sans sauce (optionnel)</option>
            {sauces.map((s) => (
              <option key={s.id} value={s.id}>
                {cleanIngredientName(s.nom)}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {legumes.slice(0, 10).map((l) => {
            const active = selectedLegumes.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => toggleLegume(l.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {cleanIngredientName(l.nom)}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={addRecipe}
            className="min-h-[44px] w-full touch-manipulation rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-600 hover:to-sky-700 sm:w-auto"
          >
            Ajouter ma recette au planificateur
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
        <h2 className="mb-4 font-heading text-lg font-bold text-stone-900">
          Mes recettes ({sandwichesFiltres.length})
        </h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <input
            type="text"
            placeholder="Filtrer par ingrédient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-800 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
          <input
            type="number"
            step={0.1}
            placeholder="Coût sandwich max (€)"
            value={maxCout ?? ""}
            onChange={(e) =>
              setMaxCout(e.target.value ? parseFloat(e.target.value) : null)
            }
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-800 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
          <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={avecLegumesOnly}
              onChange={(e) => setAvecLegumesOnly(e.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-400"
            />
            Avec légumes uniquement
          </label>
        </div>
        {sandwichesFiltres.length === 0 ? (
          <p className="text-stone-500">
            Aucune recette. Créez-en une avec le formulaire ci-dessus.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sandwichesFiltres.map((s) => (
              <div
                key={s.id}
                className="relative cursor-pointer space-y-2 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-lg shadow-stone-900/5 transition hover:border-amber-200 hover:shadow-xl"
                onClick={() => setDetailSandwich(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setDetailSandwich(s);
                }}
                role="button"
                tabIndex={0}
                aria-label="Voir le détail du sandwich"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Supprimer la recette « ${s.nom} » ?`)) {
                      removeCustomSandwich(s.id);
                      if (detailSandwich?.id === s.id) setDetailSandwich(null);
                    }
                  }}
                  className="absolute right-2 top-2 rounded-lg bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200"
                  aria-label="Supprimer cette recette"
                >
                  Supprimer
                </button>
                <p className="line-clamp-2 pr-20 text-center text-sm font-semibold text-stone-800">
                  {s.nom}
                </p>
                <SandwichVisualCard sandwich={s} hideName />
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-stone-200/80 bg-stone-50/80 px-3 py-2 text-xs text-stone-600">
                  <span className="inline-flex items-center gap-1">
                    <span role="img" aria-label="Pain">{getCategoryIcon("pain")}</span>
                    {cleanIngredientName(s.pain.nom)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span role="img" aria-label="Viande">{getCategoryIcon(s.proteine.categorie === "proteine_vegetarienne" ? "proteine_vegetarienne" : "viande")}</span>
                    {cleanIngredientName(s.proteine.nom)}
                  </span>
                  {s.fromage && (
                    <span className="inline-flex items-center gap-1">
                      <span role="img" aria-label="Fromage">{getCategoryIcon("fromage")}</span>
                      {cleanIngredientName(s.fromage.nom)}
                    </span>
                  )}
                  {s.sauce && (
                    <span className="inline-flex items-center gap-1">
                      <span role="img" aria-label="Sauce">{getCategoryIcon("sauce")}</span>
                      {cleanIngredientName(s.sauce.nom)}
                    </span>
                  )}
                  {(s.legumes ?? []).map((l) => (
                    <span key={l.id} className="inline-flex items-center gap-1">
                      <span role="img" aria-label="Légumes">{getCategoryIcon("legumes")}</span>
                      {cleanIngredientName(l.nom)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {detailSandwich && (
          <SandwichDetailModal
            sandwich={detailSandwich}
            menu={null}
            onClose={() => setDetailSandwich(null)}
          />
        )}
      </section>
    </div>
  );
}

