import type { ApiVideo } from "@/lib/types";

export function ResultPanel({ video }: { video: ApiVideo }) {
  if (video.status === "FAILED") {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger/10 p-5 text-sm text-danger">
        <p className="font-semibold">La generation a echoue.</p>
        <p className="mt-1 text-danger/90">{video.errorMessage ?? "Erreur inconnue."}</p>
      </div>
    );
  }

  if (video.status !== "DONE" || !video.videoPath) return null;

  return (
    <div className="space-y-4">
      {video.script && !video.script.factChecked && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          ⚠️ Aucune source Wikipedia fiable n&apos;a ete trouvee pour ce sujet. Verifie les informations
          avant de publier cette video.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <video
          src={video.videoPath}
          poster={video.thumbnailPath ?? undefined}
          controls
          playsInline
          loop
          className="aspect-[9/16] w-full max-w-[280px] rounded-xl border border-border bg-black"
        />

        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-semibold">{video.title}</h3>

          <div className="flex flex-wrap gap-2">
            {(video.hashtags ?? []).map((tag) => (
              <span key={tag} className="rounded-full bg-surface-hover px-2 py-1 text-xs text-muted">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <a href={video.videoPath} download className="rounded-lg bg-accent px-3 py-2 font-medium hover:bg-accent-hover">
              ⬇️ Telecharger la video
            </a>
            {video.srtPath && (
              <a href={video.srtPath} download className="rounded-lg border border-border px-3 py-2 hover:bg-surface-hover">
                📝 Telecharger les sous-titres (.srt)
              </a>
            )}
          </div>

          {video.sources && video.sources.length > 0 && (
            <div className="pt-2 text-sm">
              <p className="mb-1 text-muted">Sources utilisees :</p>
              <ul className="space-y-1">
                {video.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
