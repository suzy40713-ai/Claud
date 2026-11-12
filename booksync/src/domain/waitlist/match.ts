/**
 * Liste d'attente intelligente — logique pure (aucun accès base ni réseau).
 * Un créneau libéré est proposé aux clients compatibles, dans l'ordre d'inscription.
 */

export const TIME_RANGES = {
  any: { label: "Indifférent", from: 0, to: 24 * 60 },
  morning: { label: "Matin (avant 12 h)", from: 0, to: 12 * 60 },
  afternoon: { label: "Après-midi (12 h – 17 h)", from: 12 * 60, to: 17 * 60 },
  evening: { label: "Fin de journée (après 17 h)", from: 17 * 60, to: 24 * 60 },
} as const;

export type TimeRange = keyof typeof TIME_RANGES;

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

/** Durée pendant laquelle un créneau est réservé au(x) client(s) prévenu(s). */
export const OFFER_HOLD_MINUTES = 120;
/** Pas de proposition si le rendez-vous commence dans moins de ce délai. */
export const OFFER_MIN_LEAD_MINUTES = 60;
/** Nombre de clients prévenus en même temps pour un créneau (le premier qui confirme l'obtient). */
export const OFFERS_PER_SLOT = 3;

export type WaitlistCandidate = {
  id: string;
  createdAt: Date;
  serviceId: string;
  /** null = n'importe quel employé */
  staffId: string | null;
  dateFrom: string;
  dateTo: string;
  /** 1 = lundi … 7 = dimanche ; vide = tous les jours */
  weekdays: number[];
  fromMinute: number;
  toMinute: number;
};

export type FreedSlot = {
  staffId: string;
  /** Date locale (fuseau de l'entreprise) au format AAAA-MM-JJ */
  date: string;
  weekday: number;
  /** Minute locale de début (0–1439) */
  minute: number;
  /** Durée libérée, temps tampon compris */
  freeMinutes: number;
};

export type ServiceFit = { blockMinutes: number; staffIds: string[] };

/** Le créneau respecte-t-il les préférences du client et la durée de la prestation demandée ? */
export function isCompatible(
  entry: WaitlistCandidate,
  slot: FreedSlot,
  services: Record<string, ServiceFit>,
) {
  const svc = services[entry.serviceId];
  if (!svc) return false;
  if (!svc.staffIds.includes(slot.staffId)) return false;
  if (svc.blockMinutes > slot.freeMinutes) return false;
  if (entry.staffId && entry.staffId !== slot.staffId) return false;
  if (slot.date < entry.dateFrom || slot.date > entry.dateTo) return false;
  if (entry.weekdays.length && !entry.weekdays.includes(slot.weekday)) return false;
  return slot.minute >= entry.fromMinute && slot.minute < entry.toMinute;
}

/** Clients à prévenir, par ordre d'inscription (premier inscrit, premier servi). */
export function matchWaitlist(
  entries: WaitlistCandidate[],
  slot: FreedSlot,
  services: Record<string, ServiceFit>,
  opts: { exclude?: ReadonlySet<string>; limit?: number } = {},
) {
  return entries
    .filter((e) => !opts.exclude?.has(e.id) && isCompatible(e, slot, services))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
    .slice(0, opts.limit ?? OFFERS_PER_SLOT);
}

/**
 * Échéance d'une proposition : 2 h au plus, et au moins 1 h avant le rendez-vous.
 * null si le rendez-vous est trop proche pour être proposé.
 */
export function offerExpiry(now: Date, startsAt: Date, holdMinutes = OFFER_HOLD_MINUTES) {
  const latest = startsAt.getTime() - OFFER_MIN_LEAD_MINUTES * 60_000;
  if (latest - now.getTime() < 15 * 60_000) return null;
  return new Date(Math.min(now.getTime() + holdMinutes * 60_000, latest));
}

export function rangeOf(fromMinute: number, toMinute: number): TimeRange {
  const hit = (Object.keys(TIME_RANGES) as TimeRange[]).find(
    (k) => TIME_RANGES[k].from === fromMinute && TIME_RANGES[k].to === toMinute,
  );
  return hit ?? "any";
}

export function describePreferences(e: {
  weekdays: number[];
  fromMinute: number;
  toMinute: number;
}) {
  const days =
    e.weekdays.length === 0 || e.weekdays.length === 7
      ? "Tous les jours"
      : [...e.weekdays]
          .sort()
          .map((d) => WEEKDAY_LABELS[d - 1])
          .join(", ");
  return `${days} · ${TIME_RANGES[rangeOf(e.fromMinute, e.toMinute)].label}`;
}
