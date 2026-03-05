/**
 * Service optionnel pour connecter une API produit (ex. METRO).
 * Prévoir l'appel à une API réelle pour disponibilité et prix.
 */

export interface ProductAvailability {
  productName: string;
  price: number;
  inStock: boolean;
}

/**
 * Récupère la disponibilité (et éventuellement le prix) d'un produit par nom.
 * Pour l'instant retourne une valeur par défaut ; à brancher sur une API réelle.
 */
export async function getProductAvailability(
  name: string
): Promise<ProductAvailability | null> {
  // TODO: appeler l'API METRO ou autre
  // const res = await fetch(`/api/metro/product?name=${encodeURIComponent(name)}`);
  // if (!res.ok) return null;
  // return res.json();
  return {
    productName: name,
    price: 0,
    inStock: true,
  };
}
