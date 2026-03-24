import { NextRequest, NextResponse } from "next/server";
import { searchMetroProducts } from "@/lib/metroProductsDb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

  try {
    const products = await searchMetroProducts(q, limit);
    return NextResponse.json(products);
  } catch (e) {
    console.error("metro-products search error:", e);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
