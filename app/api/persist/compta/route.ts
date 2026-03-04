import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSupabaseServer, hasSupabaseConfig } from "@/lib/supabase-server";

const COMPTA_ROW_ID = "default";

/** En production (Vercel), la compta doit être en base pour que tout le monde la voie. */
function isProduction(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}
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
  const toRecord = (v: unknown): Record<string, number> => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const out: Record<string, number> = {};
      for (const [k, val] of Object.entries(v)) {
        const n = typeof val === "number" ? val : Number(val);
        if (Number.isFinite(n)) out[String(k)] = n;
      }
      return out;
    }
    return {};
  };
  return {
    ventesParNomSandwich: toRecord(data.ventes_menus),
    ventesBoissons: toRecord(data.ventes_boissons),
    ventesSnacks: toRecord(data.ventes_snacks),
  };
}

function toJsonbRecord(o: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(o)) {
    if (k != null && Number.isFinite(Number(v))) out[String(k)] = Number(v);
  }
  return out;
}

async function writeComptaSupabase(payload: ComptaPayload): Promise<void> {
  const supabase = getSupabaseServer();
  const row = {
    id: COMPTA_ROW_ID,
    ventes_menus: toJsonbRecord(payload.ventesParNomSandwich ?? {}),
    ventes_boissons: toJsonbRecord(payload.ventesBoissons ?? {}),
    ventes_snacks: toJsonbRecord(payload.ventesSnacks ?? {}),
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
    // En production sans Supabase : pas de fichier partagé → retourner vide
    if (isProduction() && !hasSupabaseConfig()) {
      return NextResponse.json(ensureObjects(null), {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }
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
      ventesParNomSandwich: body.ventesParNomSandwich && typeof body.ventesParNomSandwich === "object" && !Array.isArray(body.ventesParNomSandwich)
        ? toJsonbRecord(body.ventesParNomSandwich as Record<string, number>)
        : {},
      ventesBoissons: body.ventesBoissons && typeof body.ventesBoissons === "object" && !Array.isArray(body.ventesBoissons)
        ? toJsonbRecord(body.ventesBoissons as Record<string, number>)
        : {},
      ventesSnacks: body.ventesSnacks && typeof body.ventesSnacks === "object" && !Array.isArray(body.ventesSnacks)
        ? toJsonbRecord(body.ventesSnacks as Record<string, number>)
        : {},
    };

    // En production : la compta doit être en Supabase pour que tout le monde la voie
    if (isProduction() && !hasSupabaseConfig()) {
      return NextResponse.json(
        {
          error: "Comptabilité non sauvegardée",
          message: "Configurez Supabase (variables d’environnement sur Vercel) pour que la comptabilité soit enregistrée et visible par tout le monde. Sans base de données, les ventes ne peuvent pas être partagées.",
        },
        { status: 503 },
      );
    }

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
