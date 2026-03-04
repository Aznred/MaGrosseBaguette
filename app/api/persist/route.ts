import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { PersistPayload } from "@/lib/persistTypes";
import { NOMS_SANDWICHS_PAR_DEFAUT } from "@/lib/persistTypes";
import { QUANTITES_PAR_DEFAUT } from "@/lib/pricing";

const STORE_KEY = "sandwich-app:store";
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

function normalizePayload(raw: unknown): PersistPayload {
  const data = raw as Record<string, unknown> | null;
  if (!data || typeof data !== "object") {
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
  return {
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
    customSandwiches: Array.isArray(data.customSandwiches) ? data.customSandwiches : [],
    quantites: { ...QUANTITES_PAR_DEFAUT, ...(data.quantites as object) },
    sandwichNames:
      Array.isArray(data.sandwichNames) && data.sandwichNames.length > 0
        ? data.sandwichNames
        : NOMS_SANDWICHS_PAR_DEFAUT,
    ventesParNomSandwich: (data.ventesParNomSandwich as Record<string, number>) ?? {},
    ventesBoissons: (data.ventesBoissons as Record<string, number>) ?? {},
    ventesSnacks: (data.ventesSnacks as Record<string, number>) ?? {},
  };
}

// ——— Stockage fichier (local / dev sans Redis)
async function readStoreFile(): Promise<PersistPayload> {
  try {
    const raw = await readFile(STORE_FILE, "utf-8");
    return normalizePayload(JSON.parse(raw));
  } catch {
    return normalizePayload(null);
  }
}

async function writeStoreFile(payload: PersistPayload): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

// ——— Stockage Redis (production Vercel)
async function readStoreRedis(): Promise<PersistPayload> {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  const raw = await redis.get(STORE_KEY);
  return normalizePayload(raw);
}

async function writeStoreRedis(payload: PersistPayload): Promise<void> {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  await redis.set(STORE_KEY, payload);
}

function useRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export async function GET() {
  try {
    const data = useRedis() ? await readStoreRedis() : await readStoreFile();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Persist GET error", e);
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
    if (useRedis()) {
      await writeStoreRedis(payload);
    } else {
      await writeStoreFile(payload);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Persist POST error", e);
    return NextResponse.json(
      { error: "Erreur sauvegarde données" },
      { status: 500 },
    );
  }
}
