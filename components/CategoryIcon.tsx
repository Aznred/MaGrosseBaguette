"use client";

import type { IngredientCategory } from "@/lib/types";

const ICONS: Record<IngredientCategory, string> = {
  pain: "🍞",
  viande: "🥩",
  proteine_vegetarienne: "🌱",
  fromage: "🧀",
  sauce: "🫙",
  legumes: "🥬",
  boisson: "🥤",
  dessert: "🍰",
  emballage: "📦",
};

const LABELS: Record<IngredientCategory, string> = {
  pain: "Pain",
  viande: "Viande",
  proteine_vegetarienne: "Protéine végétale",
  fromage: "Fromage",
  sauce: "Sauce",
  legumes: "Légumes",
  boisson: "Boisson",
  dessert: "Dessert",
  emballage: "Emballage",
};

interface Props {
  category: IngredientCategory;
  /** Taille : sm (texte), base, lg */
  size?: "sm" | "base" | "lg";
  className?: string;
}

export function CategoryIcon({
  category,
  size = "base",
  className = "",
}: Props) {
  const emoji = ICONS[category];
  const label = LABELS[category];
  const sizeClass =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClass} ${className}`}
      role="img"
      aria-label={label}
      title={label}
    >
      {emoji}
    </span>
  );
}

export function getCategoryIcon(category: IngredientCategory): string {
  return ICONS[category];
}
