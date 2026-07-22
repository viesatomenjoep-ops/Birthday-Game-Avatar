import { promises as fs } from "fs";
import path from "path";
import { createServiceClient, getGameBySlug as getGameFromSupabase } from "./supabase";
import { uploadAvatar } from "./cloudinary";
import type { GameRecord } from "./supabase";

/**
 * Opslaglaag met automatische fallback:
 * - Zijn de cloud-keys ingevuld → Cloudinary + Supabase (productie).
 * - Zo niet → lokale bestandsopslag, zodat de hele flow werkt zonder setup.
 *
 * De lokale modus is bedoeld voor dev/demo op één machine; op Vercel is het
 * bestandssysteem read-only, dus daar zijn de cloud-keys verplicht.
 */

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const PUBLIC_AVATAR_DIR = path.join(process.cwd(), "public", "avatars");
const LOCAL_DB_FILE = path.join(process.cwd(), ".data", "games.json");

/**
 * Bewaar de (transparante) avatar-PNG en geef een publieke URL terug.
 * Cloudinary indien geconfigureerd, anders lokaal onder /public/avatars.
 */
export async function storeAvatar(buffer: Buffer, slug: string): Promise<string> {
  if (isCloudinaryConfigured()) {
    return uploadAvatar(buffer, slug);
  }

  await fs.mkdir(PUBLIC_AVATAR_DIR, { recursive: true });
  await fs.writeFile(path.join(PUBLIC_AVATAR_DIR, `${slug}.png`), buffer);
  return `/avatars/${slug}.png`;
}

type NewGame = Omit<GameRecord, "id" | "created_at">;

/** Sla een game-record op (Supabase of lokaal JSON-bestand). */
export async function saveGame(record: NewGame): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createServiceClient();
    const { error } = await supabase.from("games").insert(record);
    if (error) throw new Error(error.message);
    return;
  }

  const games = await readLocalGames();
  games.push({
    ...record,
    id: record.slug,
    created_at: new Date().toISOString(),
  });
  await fs.mkdir(path.dirname(LOCAL_DB_FILE), { recursive: true });
  await fs.writeFile(LOCAL_DB_FILE, JSON.stringify(games, null, 2), "utf8");
}

/** Haal een game op via slug (Supabase of lokaal JSON-bestand). */
export async function getGame(slug: string): Promise<GameRecord | null> {
  if (isSupabaseConfigured()) {
    return getGameFromSupabase(slug);
  }
  const games = await readLocalGames();
  return games.find((g) => g.slug === slug) ?? null;
}

async function readLocalGames(): Promise<GameRecord[]> {
  try {
    const raw = await fs.readFile(LOCAL_DB_FILE, "utf8");
    return JSON.parse(raw) as GameRecord[];
  } catch {
    return [];
  }
}
