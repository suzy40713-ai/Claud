import { BarChart3, Bookmark, LayoutDashboard, Library, Search, Sparkles, Wand2 } from "lucide-react";

/**
 * Static illustration of the product UI for the landing page. It contains no
 * metrics: the cards show placeholder content, and the caption says so.
 */
export function DashboardPreview() {
  const nav = [
    { icon: LayoutDashboard, label: "Tableau de bord", active: false },
    { icon: Library, label: "Ad Library", active: true },
    { icon: Sparkles, label: "AI Analyzer", active: false },
    { icon: Wand2, label: "Ad Creator", active: false },
    { icon: BarChart3, label: "Trend Radar", active: false },
    { icon: Bookmark, label: "Collections", active: false },
  ];
  const cards = [
    { brand: "Marque A", niche: "Beauté", format: "Vidéo", platform: "Instagram" },
    { brand: "Marque B", niche: "Fitness", format: "Carrousel", platform: "TikTok" },
    { brand: "Marque C", niche: "Maison", format: "Image", platform: "Facebook" },
    { brand: "Marque D", niche: "Tech", format: "Vidéo", platform: "TikTok" },
    { brand: "Marque E", niche: "Mode", format: "Carrousel", platform: "Instagram" },
    { brand: "Marque F", niche: "Animaux", format: "Image", platform: "Facebook" },
  ];

  return (
    <figure className="relative mx-auto w-full max-w-5xl">
      <div className="pointer-events-none absolute -inset-x-10 -top-10 h-64 bg-radial-violet blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_120px_-30px_rgba(118,87,255,0.45)]">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
          <div className="ml-4 hidden h-6 flex-1 items-center rounded-md bg-background/60 px-3 text-[11px] text-muted-foreground sm:flex">
            app.adhunter / ad-library
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
          <aside className="hidden border-r border-border p-3 md:block">
            {nav.map((n) => (
              <div key={n.label} className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] ${n.active ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </div>
            ))}
          </aside>
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-[13px] text-muted-foreground">
                <Search className="h-4 w-4 shrink-0" /> <span className="truncate">Rechercher une marque, un produit, un mot-clé…</span>
              </div>
              {["Niche", "Plateforme", "Pays", "Format"].map((f) => (
                <span key={f} className="hidden h-9 items-center rounded-lg border border-border px-3 text-[13px] text-muted-foreground sm:inline-flex">{f}</span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
              {cards.map((c, i) => (
                <div key={c.brand} className="rounded-xl border border-border bg-background/40 p-3">
                  <div
                    className="aspect-[4/3] rounded-lg"
                    style={{ background: `linear-gradient(${135 + i * 25}deg, rgba(118,87,255,${0.35 - i * 0.03}) 0%, rgba(23,26,33,1) 80%)` }}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[13px] font-medium">{c.brand}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{c.platform}</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 w-full rounded bg-secondary" />
                    <div className="h-2 w-2/3 rounded bg-secondary" />
                  </div>
                  <div className="mt-3 flex gap-1.5 text-[10px] text-muted-foreground">
                    <span className="rounded border border-border px-1.5 py-0.5">{c.niche}</span>
                    <span className="rounded border border-border px-1.5 py-0.5">{c.format}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">Aperçu de l'interface — contenus d'illustration.</figcaption>
    </figure>
  );
}
