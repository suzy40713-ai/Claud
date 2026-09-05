import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { ApiVideo } from "@/lib/types";
import { VideoDetailClient } from "@/components/VideoDetailClient";
import { DeleteVideoButton } from "@/components/DeleteVideoButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) notFound();

  return (
    <>
      <VideoDetailClient initialVideo={video as unknown as ApiVideo} />
      <div className="mx-auto max-w-3xl px-6 pb-10">
        <DeleteVideoButton id={id} />
      </div>
    </>
  );
}
