"use client";

import { useRouter } from "next/navigation";

export function DeleteVideoButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Supprimer cette video definitivement ?")) return;
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/videos");
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-lg border border-danger/40 px-4 py-2 text-sm text-danger hover:bg-danger/10"
    >
      🗑️ Supprimer cette video
    </button>
  );
}
