"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ApiVideoListItem } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

function statusBadgeClass(status: ApiVideoListItem["status"]): string {
  if (status === "DONE") return "bg-success/20 text-success";
  if (status === "FAILED") return "bg-danger/20 text-danger";
  return "bg-accent-soft text-accent";
}

export function VideosListClient() {
  const [videos, setVideos] = useState<ApiVideoListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setVideos(data.videos ?? []);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette video definitivement ?")) return;
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setVideos((prev) => prev?.filter((v) => v.id !== id) ?? null);
    } else {
      setError("Suppression impossible.");
    }
  }

  async function handleEdit(video: ApiVideoListItem) {
    const nextTitle = window.prompt("Nouveau titre :", video.title ?? video.subject);
    if (!nextTitle || !nextTitle.trim()) return;
    const res = await fetch(`/api/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setVideos((prev) => prev?.map((v) => (v.id === video.id ? { ...v, title: data.video.title } : v)) ?? null);
    } else {
      setError("Modification impossible.");
    }
  }

  if (!videos) {
    return <p className="px-6 py-16 text-center text-muted">Chargement...</p>;
  }

  if (videos.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted">
        <p>Aucune video pour l&apos;instant.</p>
        <Link href="/" className="mt-3 inline-block text-accent hover:underline">
          Creer ta premiere video
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Mes videos</h1>
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {videos.map((video) => (
          <div key={video.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <Link href={`/videos/${video.id}`}>
              <div className="aspect-[9/16] bg-background">
                {video.thumbnailPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnailPath} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            </Link>
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm font-medium">{video.title ?? video.subject}</p>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{new Date(video.createdAt).toLocaleDateString("fr-FR")}</span>
                <span>{video.durationSec}s</span>
              </div>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(video.status)}`}>
                {STATUS_LABELS[video.status]}
              </span>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <Link href={`/videos/${video.id}`} className="rounded border border-border px-2 py-1 hover:bg-surface-hover">
                  Voir
                </Link>
                {video.videoPath && (
                  <a href={video.videoPath} download className="rounded border border-border px-2 py-1 hover:bg-surface-hover">
                    Telecharger
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleEdit(video)}
                  className="rounded border border-border px-2 py-1 hover:bg-surface-hover"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(video.id)}
                  className="rounded border border-danger/40 px-2 py-1 text-danger hover:bg-danger/10"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
