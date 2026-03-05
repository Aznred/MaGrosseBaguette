import { NextRequest, NextResponse } from "next/server";
import { parseMetroContentToIngredientsServer } from "@/lib/metroParseServer";
import { seedMetroProducts } from "@/lib/metroProductsDb";

/** POST body: { url?: string, content?: string }
 * - Si url: on fetch le contenu puis on parse (CSV/HTML) et on enregistre en base.
 * - Si content: on parse directement et on enregistre.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : undefined;
    const content = typeof body.content === "string" ? body.content : undefined;

    let text = content;
    if (!text && url) {
      const res = await fetch(url);
      if (!res.ok) {
        return NextResponse.json(
          { error: "Impossible de récupérer l'URL" },
          { status: 400 }
        );
      }
      text = await res.text();
    }

    if (!text) {
      return NextResponse.json(
        { error: "Fournissez url ou content dans le body" },
        { status: 400 }
      );
    }

    const ingredients = await parseMetroContentToIngredientsServer(text);
    const count = await seedMetroProducts(ingredients, url);
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error("metro-products seed error:", e);
    return NextResponse.json(
      { error: "Erreur lors de l'import" },
      { status: 500 }
    );
  }
}
