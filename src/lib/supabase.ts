import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type InvitationData = {
  greeting?: string;
  sections?: { label: string; lines: string[] }[];
  slogan?: string;
};

export type GameRecord = {
  id: string;
  slug: string;
  child_name: string;
  age: number;
  party_date: string; // ISO date
  party_time: string; // HH:mm
  avatar_url: string;
  created_at: string;
  costume?: string | null;
  invitation?: InvitationData | null;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Ontbrekende environment variable: ${name}`);
  }
  return value;
}

/**
 * Server-side client met service-role key. Omzeilt RLS — alleen gebruiken
 * in API-routes/server-actions, nooit importeren in client components.
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

/**
 * Anon client voor publieke reads (game-pagina). RLS staat alleen SELECT toe.
 */
export function createAnonClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } }
  );
}

export async function getGameBySlug(slug: string): Promise<GameRecord | null> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Supabase getGameBySlug error:", error.message);
      return null;
    }
    return data as GameRecord | null;
  } catch (error) {
    // Bijv. ontbrekende env vars in lokale dev — toon dan een nette 404.
    console.error("Supabase client error:", error);
    return null;
  }
}
