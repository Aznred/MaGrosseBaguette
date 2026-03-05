"use client";

import type { Sandwich, Ingredient } from "@/lib/types";

interface Props {
  sandwich: Sandwich;
  /** Optionnel : afficher en plus compact (dashboard) */
  compact?: boolean;
  /** Optionnel : cacher le nom (affiché au-dessus de la carte ailleurs) */
  hideName?: boolean;
}

/** Couleurs réalistes type sub : pain doré, salade verte, viande rose, fromage crème */
function getIngredientStyle(ingredient: Ingredient): {
  bg: string;
  /** Contour noir type illustration pour séparation nette */
  outline: string;
  /** Salade/laitue : effet feuilles ondulées */
  ruffled?: boolean;
  /** Viande : effet tranches légèrement ondulées */
  wavy?: boolean;
} {
  const nom = ingredient.nom.toLowerCase();
  const cat = ingredient.categorie;

  if (cat === "pain") {
    if (nom.includes("complet") || nom.includes("céréale"))
      return { bg: "bg-amber-700", outline: "border-amber-900" };
    if (nom.includes("noir") || nom.includes("seigle"))
      return { bg: "bg-amber-900", outline: "border-amber-950" };
    return { bg: "bg-amber-400", outline: "border-amber-800" };
  }

  if (cat === "viande" || cat === "proteine_vegetarienne") {
    if (nom.includes("jambon"))
      return { bg: "bg-rose-200", outline: "border-rose-400", wavy: true };
    if (nom.includes("poulet"))
      return { bg: "bg-amber-100", outline: "border-amber-400", wavy: true };
    if (nom.includes("chorizo") || nom.includes("saucisse"))
      return { bg: "bg-red-500", outline: "border-red-800", wavy: true };
    if (nom.includes("dinde"))
      return { bg: "bg-rose-100", outline: "border-rose-300", wavy: true };
    if (nom.includes("bacon") || nom.includes("lard"))
      return { bg: "bg-orange-800", outline: "border-orange-900", wavy: true };
    if (nom.includes("thôn") || nom.includes("thon"))
      return { bg: "bg-amber-50", outline: "border-amber-300", wavy: true };
    if (nom.includes("vege") || nom.includes("tofu") || nom.includes("falafel"))
      return { bg: "bg-emerald-500", outline: "border-emerald-700" };
    return { bg: "bg-rose-200", outline: "border-rose-400", wavy: true };
  }

  if (cat === "fromage") {
    if (nom.includes("emmental") || nom.includes("comté") || nom.includes("comte"))
      return { bg: "bg-yellow-200", outline: "border-yellow-600" };
    if (nom.includes("mozza"))
      return { bg: "bg-amber-50", outline: "border-amber-300" };
    if (nom.includes("chèvre") || nom.includes("chevre"))
      return { bg: "bg-stone-100", outline: "border-stone-400" };
    if (nom.includes("bleu"))
      return { bg: "bg-slate-200", outline: "border-slate-500" };
    return { bg: "bg-yellow-100", outline: "border-yellow-500" };
  }

  if (cat === "sauce") {
    if (nom.includes("mayo"))
      return { bg: "bg-yellow-50", outline: "border-yellow-300" };
    if (nom.includes("pesto"))
      return { bg: "bg-emerald-300", outline: "border-emerald-600" };
    if (nom.includes("ketchup"))
      return { bg: "bg-red-400", outline: "border-red-700" };
    if (nom.includes("curry"))
      return { bg: "bg-yellow-300", outline: "border-yellow-600" };
    if (nom.includes("andalouse"))
      return { bg: "bg-orange-100", outline: "border-orange-400" };
    return { bg: "bg-amber-50", outline: "border-amber-300" };
  }

  if (cat === "legumes") {
    if (nom.includes("tomate"))
      return { bg: "bg-red-500", outline: "border-red-700" };
    if (nom.includes("salade") || nom.includes("laitue"))
      return { bg: "bg-green-400", outline: "border-green-600", ruffled: true };
    if (nom.includes("cornichon"))
      return { bg: "bg-green-600", outline: "border-green-800" };
    if (nom.includes("oignon"))
      return { bg: "bg-amber-50", outline: "border-amber-300" };
    if (nom.includes("poivron"))
      return { bg: "bg-red-400", outline: "border-red-600" };
    if (nom.includes("concombre"))
      return { bg: "bg-green-300", outline: "border-green-500" };
    if (nom.includes("carotte"))
      return { bg: "bg-orange-400", outline: "border-orange-600" };
    return { bg: "bg-green-400", outline: "border-green-600", ruffled: true };
  }

  return { bg: "bg-slate-300", outline: "border-slate-600" };
}

export function SandwichVisualCard({ sandwich, compact, hideName }: Props) {
  const layers: Ingredient[] = [
    sandwich.pain,
    sandwich.proteine,
    ...(sandwich.fromage ? [sandwich.fromage] : []),
    ...(sandwich.sauce ? [sandwich.sauce] : []),
    ...(sandwich.legumes ?? []),
    sandwich.pain,
  ];

  return (
    <div
      className={`group rounded-2xl border-2 border-stone-200/80 bg-white shadow-lg shadow-stone-900/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-amber-200 ${compact ? "p-2" : "p-3"}`}
    >
      {/* Sub en coupe, style réaliste : contours nets, pain texturé, salade ondulée */}
      <div
        className={`relative mx-auto overflow-hidden rounded-xl bg-stone-50 ${compact ? "max-w-[140px]" : "max-w-[200px]"}`}
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="flex flex-col gap-0 rounded-lg p-1.5">
          {layers.map((ing, i) => {
            const style = getIngredientStyle(ing);
            const isPain = ing.categorie === "pain";
            const isFirst = i === 0;
            const isLast = i === layers.length - 1;
            const height = isPain
              ? compact ? "h-5" : "h-6"
              : compact ? "h-3" : "h-4";
            return (
              <div
                key={`${ing.id}-${i}`}
                className={`${height} ${style.bg} border-[1.5px] ${style.outline} transition group-hover:brightness-[1.02] ${
                  style.ruffled
                    ? "rounded-full"
                    : style.wavy
                      ? "rounded-lg"
                      : "rounded"
                } ${isFirst ? "rounded-t-xl border-b-2 border-amber-800" : ""} ${isLast ? "rounded-b-xl border-t-2 border-amber-800" : ""}`}
                style={{
                  minHeight: compact ? "10px" : "14px",
                  boxShadow: isPain
                    ? "inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.06)"
                    : "inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              />
            );
          })}
        </div>
      </div>

      {!compact && (
        <>
          {!hideName && (
            <div className="mt-3 line-clamp-2 text-sm font-semibold text-slate-800">
              {sandwich.nom}
            </div>
          )}
          <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
            {sandwich.cout.toFixed(2)} €
          </div>
        </>
      )}
    </div>
  );
}
