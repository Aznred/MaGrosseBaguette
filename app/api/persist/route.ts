import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { PersistPayload } from "@/lib/persistTypes";
import { NOMS_SANDWICHS_PAR_DEFAUT } from "@/lib/persistTypes";
import { QUANTITES_PAR_DEFAUT } from "@/lib/pricing";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

async function readStore(): Promise<PersistPayload> {
  try {
    const raw = await readFile(STORE_FILE, "utf-8");
    const data = JSON.parse(raw) as PersistPayload;
    return {
      ingredients: data.ingredients ?? [],
      customSandwiches: data.customSandwiches ?? [],
      quantites: { ...QUANTITES_PAR_DEFAUT, ...data.quantites },
      sandwichNames:
        Array.isArray(data.sandwichNames) && data.sandwichNames.length > 0
          ? data.sandwichNames
          : NOMS_SANDWICHS_PAR_DEFAUT,
      ventesParNomSandwich: data.ventesParNomSandwich ?? {},
      ventesBoissons: data.ventesBoissons ?? {},
      ventesSnacks: data.ventesSnacks ?? {},
    };
  } catch {
    return {
      ingredients: [],
      customSandwiches: [],
      quantites: QUANTITES_PAR_DEFAUT,
      sandwichNames: NOMS_SANDWICHS_PAR_DEFAUT,
      ventesParNomSandwich: {},
      ventesBoissons: {},
      ventesSnacks: {},
    };
  }
}

async function writeStore(payload: PersistPayload): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function GET() {
  try {
    const data = await readStore();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Erreur lecture données" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PersistPayload;
    const payload: PersistPayload = {
      ingredients: body.ingredients ?? [],
      customSandwiches: body.customSandwiches ?? [],
      quantites: { ...QUANTITES_PAR_DEFAUT, ...body.quantites },
      sandwichNames:
        Array.isArray(body.sandwichNames) && body.sandwichNames.length > 0
          ? body.sandwichNames
          : NOMS_SANDWICHS_PAR_DEFAUT,
      ventesParNomSandwich: body.ventesParNomSandwich ?? {},
      ventesBoissons: body.ventesBoissons ?? {},
      ventesSnacks: body.ventesSnacks ?? {},
    };
    await writeStore(payload);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur sauvegarde données" },
      { status: 500 },
    );
  }
}
