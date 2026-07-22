import { notFound } from "next/navigation";
import { getGame } from "@/lib/store";
import SuccessDashboard from "@/components/SuccessDashboard";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
}: {
  params: { slug: string };
}) {
  const game = await getGame(params.slug);
  if (!game) notFound();

  return <SuccessDashboard game={game} />;
}
