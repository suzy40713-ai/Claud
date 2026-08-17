import { notFound } from "next/navigation";
import { joueurParId, joueurs } from "@/lib/mock-data";
import PlayerProfileClient from "@/components/profile/PlayerProfileClient";

export function generateStaticParams() {
  return joueurs.map((j) => ({ id: j.id }));
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const joueur = joueurParId(id);
  if (!joueur) notFound();

  return <PlayerProfileClient joueur={joueur} />;
}
