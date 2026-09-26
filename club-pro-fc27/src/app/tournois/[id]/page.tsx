import { notFound } from "next/navigation";
import { bracketDemo, tournois } from "@/lib/mock-data";
import TournoiDetailClient from "@/components/tournois/TournoiDetailClient";

export function generateStaticParams() {
  return tournois.map((t) => ({ id: t.id }));
}

export default async function TournoiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournoi = tournois.find((t) => t.id === id);
  if (!tournoi) notFound();

  return <TournoiDetailClient tournoi={tournoi} bracket={bracketDemo()} />;
}
