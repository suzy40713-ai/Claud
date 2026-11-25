/** Utilitaires de période pour les quotas du copilote (logique pure). */

export function monthStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
