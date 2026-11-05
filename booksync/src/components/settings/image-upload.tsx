"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Envoi d'image : aperçu, remplacement, suppression. Le serveur valide et optimise l'image. */
export function ImageUpload({
  label,
  url,
  onUpload,
  onRemove,
  shape = "square",
  hint = "PNG, JPG, WEBP ou SVG — 5 Mo maximum.",
}: {
  label: string;
  url: string | null;
  onUpload: (fd: FormData) => Promise<Result>;
  onRemove: () => Promise<Result>;
  shape?: "square" | "round" | "wide";
  hint?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function handle(fn: () => Promise<Result>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message ?? "Image enregistrée.");
      else toast.error(res.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden border bg-subtle text-muted-foreground",
          shape === "round" ? "size-16 rounded-full" : shape === "wide" ? "h-20 w-40 rounded-lg" : "size-16 rounded-xl",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className={shape === "square" ? "size-full object-contain p-1" : "size-full object-cover"} />
        ) : (
          <ImagePlus className="size-5" aria-hidden />
        )}
      </div>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? <Spinner /> : null}
            {url ? "Remplacer" : "Ajouter"}
          </Button>
          {url ? (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => handle(onRemove)}>
              <Trash2 /> Supprimer
            </Button>
          ) : null}
        </div>
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) {
            toast.error("L'image ne doit pas dépasser 5 Mo.");
            return;
          }
          const fd = new FormData();
          fd.set("file", f);
          handle(() => onUpload(fd));
        }}
      />
    </div>
  );
}
