import { NextRequest, NextResponse } from "next/server";

/** Trouve le nom de sandwich qui matche le nom de produit */
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

/** Extrait les lignes de commande d'une réponse API (formats courants) */
function extractItems(body: unknown): { productName: string; quantity: number }[] {
  if (Array.isArray(body)) {
    return body.map((row: Record<string, unknown>) => ({
      productName: String(row.productName ?? row.name ?? row.title ?? row.libelle ?? ""),
      quantity: Number(row.quantity ?? row.amount ?? row.qty ?? 1) || 1,
    }));
  }
  if (body && typeof body === "object" && "data" in body) {
    const data = (body as { data: unknown }).data;
    return extractItems(Array.isArray(data) ? data : [data]);
  }
  if (body && typeof body === "object" && "items" in body) {
    return extractItems((body as { items: unknown }).items ?? []);
  }
  if (body && typeof body === "object" && "orders" in body) {
    const orders = (body as { orders: unknown }).orders;
    return extractItems(Array.isArray(orders) ? orders : [orders]);
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apiUrl,
      accessToken,
      sandwichNames = [],
      defaultBoisson = "",
      defaultDessert = "",
    } = body as {
      apiUrl?: string;
      accessToken?: string;
      sandwichNames?: string[];
      defaultBoisson?: string;
      defaultDessert?: string;
    };

    const url = apiUrl ?? process.env.HELLOASSO_API_URL;
    const token = accessToken ?? process.env.HELLOASSO_ACCESS_TOKEN;

    if (!url) {
      return NextResponse.json(
        { error: "URL HelloAsso manquante. Configurez HELLOASSO_API_URL ou envoyez apiUrl." },
        { status: 400 }
      );
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { headers, next: { revalidate: 0 } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `HelloAsso: ${res.status}`, details: text.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items = extractItems(data);

    const orders: { sandwich: string; boisson: string; dessert: string; quantity: number }[] = [];
    for (const item of items) {
      const sandwich = matchSandwichName(item.productName, sandwichNames);
      if (sandwich) {
        orders.push({
          sandwich,
          boisson: defaultBoisson,
          dessert: defaultDessert,
          quantity: item.quantity,
        });
      }
    }

    return NextResponse.json({ orders, total: orders.reduce((s, o) => s + o.quantity, 0) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
