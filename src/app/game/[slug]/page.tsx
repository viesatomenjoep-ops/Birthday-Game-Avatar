import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/supabase";
import GameCanvas from "@/components/GameCanvas";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const game = await getGameBySlug(params.slug);
  if (!game) return { title: "Game niet gevonden" };
  return {
    title: `🎉 ${game.child_name} wordt ${game.age}! Speel de uitnodiging`,
    description: `Vang de cadeautjes en ontdek de uitnodiging voor het feestje van ${game.child_name}.`,
  };
}

export default async function GamePage({
  params,
}: {
  params: { slug: string };
}) {
  // /game/demo: speelbare demo zonder database (test & sales).
  const game =
    params.slug === "demo"
      ? {
          child_name: "Vive",
          age: 5,
          party_date: "2026-08-14",
          party_time: "14:00",
          avatar_url: "/demo-avatar.png", // bestaat niet → vrolijke fallback-avatar
        }
      : await getGameBySlug(params.slug);
  if (!game) notFound();

  const partyDate = new Date(`${game.party_date}T00:00:00`);
  const dateLabel = partyDate.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });

  return (
    <GameCanvas
      config={{
        avatarUrl: game.avatar_url,
        childName: game.child_name,
        age: game.age,
        dateLabel,
      }}
    />
  );
}
