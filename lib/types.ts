export type IngredientCategory =
  | "pain"
  | "viande"
  | "proteine_vegetarienne"
  | "fromage"
  | "sauce"
  | "legumes"
  | "boisson"
  | "dessert"
  | "emballage";

export interface Ingredient {
  id: string;
  nom: string;
  categorie: IngredientCategory;
  prixTotal: number; // prix du paquet / lot
  poidsTotal: number; // grammes totaux (mode gramme) OU unités du pack (mode unité)
  prixParGramme: number; // conservé pour compatibilité; équivaut à prix / poidsTotal
  modeTarif: "gramme" | "unite";
  vegetarien?: boolean;
}

export interface Sandwich {
  id: string;
  nom: string;
  pain: Ingredient;
  proteine: Ingredient; // viande, proteine_vegetarienne ou légume (option vegan)
  fromage?: Ingredient;
  sauce?: Ingredient;
  legumes?: Ingredient[];
  cout: number;
}

export interface Menu {
  id: string;
  sandwich: Sandwich;
  boisson: Ingredient;
  dessert: Ingredient;
  emballage: Ingredient[]; // papier, serviette, etc.
  coutEmballage: number;
  coutTotal: number;
  favori?: boolean;
}

