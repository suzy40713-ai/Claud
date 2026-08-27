import { useEffect } from "react";

// Cette app est une SPA sans framework de rendu serveur : on ajuste le titre
// et la meta description cote client a chaque page publique, pour que
// chaque URL indexee (articles de blog, pages ebook) ait des metadonnees
// distinctes plutot que le titre generique de index.html.
export function useDocumentMeta(title: string, description: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (previousDescription !== null) {
        meta?.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
