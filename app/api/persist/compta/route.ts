import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSupabaseServer, hasSupabaseConfig } from "@/lib/supabase-server";

const COMPTA_ROW_ID = "default";
const DATA_DIR = path.join(process.cwd(), "data");
const COMPTA_FILE = path.join(DATA_DIR, "compta.json");

export interface ComptaPayload {
  ventesParNomSandwich: Record<string, number>;
  ventesBoissons: Record<string, number>;
  ventesSnacks: Record<string, number>;
}

function ensureObjects(
  raw: unknown,
): { ventesParNomSandwich: Record<string, number>; ventesBoissons: Record<string, number>; ventesSnacks: Record<string, number> } {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== "object") {
    return { ventesParNomSandwich: {}, ventesBoissons: {}, ventesSnacks: {} };
  }
  return {
    ventesParNomSandwich: (o.ventesParNomSandwich as Record<string, number>) ?? {},
    ventesBoissons: (o.ventesBoissons as Record<string, number>) ?? {},
    ventesSnacks: (o.ventesSnacks as Record<string, number>) ?? {},
  };
}

// ——— Fichier (local sans Supabase)
async function readComptaFile(): Promise<ComptaPayload> {
  try {
    const raw = await readFile(COMPTA_FILE, "utf-8");
    return ensureObjects(JSON.parse(raw));
  } catch {
    return ensureObjects(null);
  }
}

async function writeComptaFile(payload: ComptaPayload): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(COMPTA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

// ——— Supabase (table dédiée app_compta)
async function readComptaSupabase(): Promise<ComptaPayload> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("app_compta")
    .select("ventes_menus, ventes_boissons, ventes_snacks")
    .eq("id", COMPTA_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("Supabase compta read error", error);
    throw error;
  }
  if (!data) {
    return ensureObjects(null);
  }
  return {
    ventesParNomSandwich: (data.ventes_menus as Record<string, number>) ?? {},
    ventesBoissons: (data.ventes_boissons as Record<string, number>) ?? {},
    ventesSnacks: (data.ventes_snacks as Record<string, number>) ?? {},
  };
}

async function writeComptaSupabase(payload: ComptaPayload): Promise<void> {
  const supabase = getSupabaseServer();
  const row = {
    id: COMPTA_ROW_ID,
    ventes_menus: payload.ventesParNomSandwich,
    ventes_boissons: payload.ventesBoissons,
    ventes_snacks: payload.ventesSnacks,
  };
  const { error } = await supabase
    .from("app_compta")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error("Supabase compta write error", error);
    throw error;
  }
}

export async function GET() {
  try {
    const data = hasSupabaseConfig()
      ? await readComptaSupabase()
      : await readComptaFile();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (e) {
    console.error("Compta GET error", e);
    return NextResponse.json(
      { error: "Erreur lecture comptabilité" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ComptaPayload;
    const payload: ComptaPayload = {
      ventesParNomSandwich: body.ventesParNomSandwich ?? {},
      ventesBoissons: body.ventesBoissons ?? {},
      ventesSnacks: body.ventesSnacks ?? {},
    };

    if (hasSupabaseConfig()) {
      await writeComptaSupabase(payload);
    } else {
      await writeComptaFile(payload);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Compta POST error", e);
    return NextResponse.json(
      { error: "Erreur sauvegarde comptabilité" },
      { status: 500 },
    );
  }
}
