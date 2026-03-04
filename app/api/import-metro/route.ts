import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Paramètre url manquant" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Impossible de récupérer la liste METRO" },
        { status: 400 },
      );
    }

    const text = await res.text();
    const contentType = res.headers.get("content-type") ?? "";

    return NextResponse.json({ content: text, contentType });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'URL METRO" },
      { status: 500 },
    );
  }
}

