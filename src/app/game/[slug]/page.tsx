import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGame } from "@/lib/store";
import GameCanvas from "@/components/GameCanvas";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const game = await getGame(params.slug);
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
    : await getGame(params.slug);
  if (!game) notFound();

  const partyDate = new Date(`${game.party_date}T00:00:00`);
  const weekday = partyDate.toLocaleDateString("nl-NL", { weekday: "long" });
  const dayMonth = partyDate.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });
  const dateLabel = `${weekday} ${dayMonth}`;
  const timeLabel = game.party_time?.slice(0, 5);

  // Demo: vaste voorbeeldtekst van Vieve. Echte games: de door de ouder
  // ingevulde uitnodiging, of anders een nette basisregel met de datum.
  const rec = game as {
    costume?: string | null;
    invitation?: {
      greeting?: string;
      sections?: { label: string; lines: string[] }[];
      slogan?: string;
    } | null;
  };

  let greeting = "Kom jij ook naar mijn kinderfeestje?";
  let slogan = "We hebben er zin in!";
  let sections: { label: string; lines: string[] }[];
  let costume: string | undefined;

  if (isDemo) {
    costume = "clown";
    sections = [
      {
        label: "Wanneer?",
        lines: [
          "Woensdag 2 september",
          "Na school gaan we samen naar Kids Wonderland!",
        ],
      },
      {
        label: "Hoe laat?",
        lines: [
          "Het feestje is om 17.00 uur afgelopen.",
          "Dan zijn we om 17.15 uur weer thuis met een volle buik want we eten frietjes! 🍟",
        ],
      },
      {
        label: "Ophalen?",
        lines: [
          "Mama's of papa's mogen jou ook om 17.00 uur bij Kids Wonderland ophalen.",
        ],
      },
    ];
  } else {
    costume = rec.costume ?? undefined;
    const inv = rec.invitation ?? undefined;
    if (inv?.greeting) greeting = inv.greeting;
    if (inv?.slogan) slogan = inv.slogan;
    sections =
      inv?.sections && inv.sections.length > 0
        ? inv.sections
        : [
            {
              label: "Wanneer?",
              lines: [`${dateLabel}${timeLabel ? ` om ${timeLabel} uur` : ""}`],
            },
          ];
  }

  return (
    <GameCanvas
      config={{
        avatarUrl: game.avatar_url,
        childName: game.child_name,
        age: game.age,
        dateLabel,
        greeting,
        sections,
        slogan,
        costume,
      }}
    />
  );
}
