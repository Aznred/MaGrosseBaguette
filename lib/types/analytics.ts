/** Commande / vente d'un menu enregistrée pour l'analyse */
export interface MenuOrder {
  id: string;
  sandwich: string;
  boisson: string;
  dessert: string;
  date: string; // ISO
  quantity: number;
}

/** Statistiques par nom (sandwich, boisson ou dessert) */
export interface NameStat {
  name: string;
  count: number;
}

/** Combinaison menu (sandwich + boisson + dessert) avec nombre d'occurrences */
export interface TopMenuCombo {
  sandwich: string;
  boisson: string;
  dessert: string;
  count: number;
  label: string;
}

/** Recommandation de production pour la semaine */
export interface ProductionRecommendation {
  sandwiches: { name: string; quantity: number }[];
  boissons: { name: string; quantity: number }[];
  desserts: { name: string; quantity: number }[];
}

/** Menu avec coût et marge estimée (pour analyse rentabilité) */
export interface MenuRentability {
  label: string; // ex. "Jambon beurre + Cristaline + Madeleine"
  sandwich: string;
  boisson: string;
  dessert: string;
  cost: number;
  margeEstimee: number; // prix de vente supposé - coût
}
