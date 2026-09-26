import { notFound } from "next/navigation";
import { clubParId, clubs } from "@/lib/mock-data";
import ClubProfileClient from "@/components/club/ClubProfileClient";

export function generateStaticParams() {
  return clubs.map((c) => ({ id: c.id }));
}

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const club = clubParId(id);
  if (!club) notFound();

  return <ClubProfileClient club={club} />;
}
