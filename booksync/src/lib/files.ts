/** URL publique d'une image stockée (logo, photo, visuel). */
export function fileUrl(id: string | null | undefined) {
  return id ? `/api/fichiers/${id}` : null;
}
