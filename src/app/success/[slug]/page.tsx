import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/supabase";
import SuccessDashboard from "@/components/SuccessDashboard";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
}: {
  params: { slug: string };
}) {
  const game = await getGameBySlug(params.slug);
  if (!game) notFound();

  return <SuccessDashboard game={game} />;
}
