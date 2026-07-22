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
  // /game/demo: speelbare demo met de echte uitnodigingsgegevens van Vieve
  // (zonder database — handig om te testen of te laten zien).
  const isDemo = params.slug === "demo";
  const game = isDemo
    ? {
        child_name: "Vieve",
        age: 5,
        party_date: "2026-09-02",
        party_time: "17:00",
        avatar_url: "/demo-avatar.png", // bestaat niet → vrolijke fallback-avatar
      }
    : await getGameBySlug(params.slug);
  if (!game) notFound();

  const partyDate = new Date(`${game.party_date}T00:00:00`);
  const weekday = partyDate.toLocaleDateString("nl-NL", { weekday: "long" });
  const dayMonth = partyDate.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });
  const dateLabel = `${weekday} ${dayMonth}`;

  return (
    <GameCanvas
      config={{
        avatarUrl: game.avatar_url,
        childName: game.child_name,
        age: game.age,
        dateLabel,
        // Extra details uit de uitnodiging (alleen ingevuld voor de demo).
        location: isDemo ? "Kids Wonderland" : undefined,
        details: isDemo
          ? [
              "Na school gaan we samen naar Kids Wonderland!",
              "Het feestje is om 17.00 uur afgelopen — daarna eten we frietjes! 🍟",
              "Ophalen mag om 17.00 uur bij Kids Wonderland.",
            ]
          : undefined,
        slogan: isDemo ? "We hebben er zin in!" : undefined,
      }}
    />
  );
}
