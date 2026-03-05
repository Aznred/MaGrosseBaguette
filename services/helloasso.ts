import type { MenuOrder } from "@/lib/types/analytics";

export interface HelloAssoOrder {
  productName: string;
  quantity: number;
  date: string;
}

/**
 * Trouve le nom de sandwich qui matche le nom de produit (ex. "Lyonnais" dans productName → "Le Lyonnais").
 */
function matchSandwichName(
  productName: string,
  sandwichNames: string[]
): string | null {
  const lower = productName.toLowerCase();
  for (const name of sandwichNames) {
    const key = name.toLowerCase().replace(/^le\s+/i, "").trim();
    if (key && lower.includes(key)) return name;
    if (lower.includes(name.toLowerCase())) return name;
  }
  return null;
}

/**
 * Récupère les commandes HelloAsso et les convertit en MenuOrder.
 * Nécessite une API HelloAsso configurée (client_id, etc.).
 * Pour l'instant : stub qui retourne [] ou données de démo si pas d'auth.
 */
export async function fetchHelloAssoOrders(
  sandwichNames: string[],
  defaultBoisson: string,
  defaultDessert: string
): Promise<Omit<MenuOrder, "id" | "date">[]> {
  // TODO: appeler https://api.helloasso.com avec les credentials
  // Exemple flow :
  // 1. GET /v5/organizations/{orgSlug}/orders avec token
  // 2. Parser les lignes de commande (productName, quantity, date)
  // 3. Pour chaque ligne, matchSandwichName(productName, sandwichNames)
  // 4. Retourner { sandwich, boisson: defaultBoisson, dessert: defaultDessert, quantity }[]

  const apiUrl = process.env.NEXT_PUBLIC_HELLOASSO_API_URL;
  const clientId = process.env.NEXT_PUBLIC_HELLOASSO_CLIENT_ID;
  if (!apiUrl || !clientId) {
    return [];
  }

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${clientId}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: HelloAssoOrder[] };
    const items = data.items ?? [];
    const orders: Omit<MenuOrder, "id" | "date">[] = [];
    for (const item of items) {
      const sandwich = matchSandwichName(item.productName, sandwichNames);
      if (sandwich) {
        orders.push({
          sandwich,
          boisson: defaultBoisson,
          dessert: defaultDessert,
          quantity: item.quantity || 1,
        });
      }
    }
    return orders;
  } catch {
    return [];
  }
}
