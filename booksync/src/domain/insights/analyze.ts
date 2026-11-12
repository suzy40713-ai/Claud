/**
 * Intelligence des données BookSync — logique pure.
 * Toutes les conclusions sont calculées à partir des rendez-vous réels fournis ; chaque
 * recommandation cite les chiffres sur lesquels elle repose. Aucune donnée n'est inventée.
 */
import type { WeeklyHours } from "@/domain/schedule/hours";

export type InsightAppointment = {
  startsAt: Date;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  cancelledAt: Date | null;
  serviceId: string | null;
  serviceName: string;
  priceCents: number;
  customerId: string;
  customerName: string;
  /** Jour (1 = lundi … 7) et heure locale du rendez-vous, dans le fuseau de l'entreprise */
  weekday: number;
  hour: number;
};

export const DAY_NAMES = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

const DAY = 86_400_000;
export const MIN_SAMPLE = 10;

export type Recommendation = {
  id: string;
  tone: "opportunity" | "warning" | "info";
  title: string;
  detail: string;
  action?: { label: string; href: string };
};

export type Insights = ReturnType<typeof analyzeBookings>;

/** Rendez-vous honoré : terminé, ou passé et toujours confirmé (non marqué absent). */
export function isVisit(a: InsightAppointment, now: Date) {
  return a.status === "completed" || (a.status === "confirmed" && a.startsAt < now);
}

function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function slotLabel(weekday: number, hour: number) {
  return `le ${DAY_NAMES[weekday - 1]} de ${hour} h à ${hour + 1} h`;
}

function isOpen(hours: WeeklyHours, weekday: number, hour: number) {
  return (hours[weekday] ?? []).some(
    (r) => r.startMinute < (hour + 1) * 60 && r.endMinute > hour * 60,
  );
}

export function analyzeBookings(input: {
  appointments: InsightAppointment[];
  now: Date;
  openingHours: WeeklyHours;
  automations: { reminders: boolean; waitlist: boolean; waitlistAvailable: boolean };
}) {
  const { appointments, now, openingHours } = input;
  const since90 = new Date(now.getTime() - 90 * DAY);
  const recent = appointments.filter((a) => a.startsAt >= since90 && a.startsAt < now);
  const recentKept = recent.filter((a) => a.status !== "cancelled");

  // Carte de chaleur jour × heure (rendez-vous non annulés des 90 derniers jours).
  const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const a of recentKept) heatmap[a.weekday - 1][a.hour]++;
  const openCells: Array<{ weekday: number; hour: number; count: number }> = [];
  for (let d = 1; d <= 7; d++)
    for (let h = 0; h < 24; h++)
      if (isOpen(openingHours, d, h))
        openCells.push({ weekday: d, hour: h, count: heatmap[d - 1][h] });
  const avgPerOpenCell = openCells.length
    ? openCells.reduce((s, c) => s + c.count, 0) / openCells.length
    : 0;
  const peakSlots = [...openCells]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.weekday - b.weekday || a.hour - b.hour)
    .slice(0, 3);
  const quietSlots = [...openCells]
    .sort((a, b) => a.count - b.count || a.weekday - b.weekday || a.hour - b.hour)
    .slice(0, 3);

  const byDay = [1, 2, 3, 4, 5, 6, 7].map((d) => ({
    weekday: d,
    count: heatmap[d - 1].reduce((s, n) => s + n, 0),
    open: (openingHours[d] ?? []).length > 0,
  }));

  // Prestations les plus demandées.
  const svcMap = new Map<string, { name: string; count: number; revenueCents: number }>();
  for (const a of recentKept) {
    const key = a.serviceId ?? a.serviceName;
    const cur = svcMap.get(key) ?? { name: a.serviceName, count: 0, revenueCents: 0 };
    cur.count++;
    if (isVisit(a, now)) cur.revenueCents += a.priceCents;
    svcMap.set(key, cur);
  }
  const services = [...svcMap.values()]
    .sort((a, b) => b.count - a.count || b.revenueCents - a.revenueCents)
    .map((s) => ({ ...s, share: pct(s.count, recentKept.length) }));

  // Annulations et absences.
  const cancelled = recent.filter((a) => a.status === "cancelled");
  const late = cancelled.filter(
    (a) => a.cancelledAt && a.startsAt.getTime() - a.cancelledAt.getTime() < DAY,
  );
  const noShows = recent.filter((a) => a.status === "no_show");
  const cancellations = {
    count: cancelled.length,
    rate: pct(cancelled.length, recent.length),
    late: late.length,
    noShows: noShows.length,
    noShowRate: pct(noShows.length, recent.length - cancelled.length),
  };

  // Tendance : 30 derniers jours contre les 30 précédents (date du rendez-vous).
  const inWindow = (from: number, to: number) =>
    appointments.filter(
      (a) =>
        a.status !== "cancelled" &&
        a.startsAt.getTime() >= now.getTime() - from * DAY &&
        a.startsAt.getTime() < now.getTime() - to * DAY,
    );
  const last30 = inWindow(30, 0);
  const prev30 = inWindow(60, 30);
  const revenue = (list: InsightAppointment[]) =>
    list.filter((a) => isVisit(a, now)).reduce((s, a) => s + a.priceCents, 0);
  const upcoming = appointments.filter(
    (a) =>
      a.status === "confirmed" &&
      a.startsAt >= now &&
      a.startsAt.getTime() < now.getTime() + 14 * DAY,
  );
  const trend = {
    last30: last30.length,
    prev30: prev30.length,
    changePct: prev30.length
      ? Math.round(((last30.length - prev30.length) / prev30.length) * 100)
      : null,
    revenueLast30: revenue(last30),
    revenuePrev30: revenue(prev30),
    upcoming14: upcoming.length,
  };

  // Clients réguliers (3 visites ou plus sur 12 mois) et clients à relancer.
  const visitsByCustomer = new Map<string, { name: string; dates: Date[] }>();
  for (const a of appointments) {
    if (!isVisit(a, now)) continue;
    const cur = visitsByCustomer.get(a.customerId) ?? { name: a.customerName, dates: [] };
    cur.dates.push(a.startsAt);
    visitsByCustomer.set(a.customerId, cur);
  }
  const hasUpcoming = new Set(
    appointments
      .filter((a) => a.status === "confirmed" && a.startsAt >= now)
      .map((a) => a.customerId),
  );
  const regulars = [...visitsByCustomer.entries()]
    .filter(([, v]) => v.dates.length >= 3)
    .map(([customerId, v]) => {
      const dates = v.dates.sort((a, b) => a.getTime() - b.getTime());
      const span = dates[dates.length - 1].getTime() - dates[0].getTime();
      const avgIntervalDays = Math.max(1, Math.round(span / DAY / (dates.length - 1)));
      const lastVisit = dates[dates.length - 1];
      const daysSince = Math.floor((now.getTime() - lastVisit.getTime()) / DAY);
      return {
        customerId,
        name: v.name,
        visits: dates.length,
        lastVisit,
        avgIntervalDays,
        daysSince,
        upcoming: hasUpcoming.has(customerId),
      };
    })
    .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
  const lapsed = regulars
    .filter((r) => !r.upcoming && r.daysSince > Math.max(30, Math.round(r.avgIntervalDays * 1.5)))
    .sort((a, b) => b.daysSince - a.daysSince);

  const sampleSize = recentKept.length;
  const enoughData = sampleSize >= MIN_SAMPLE;

  // Recommandations : uniquement fondées sur les chiffres ci-dessus.
  const recommendations: Recommendation[] = [];
  if (!enoughData) {
    recommendations.push({
      id: "sample",
      tone: "info",
      title: "Pas encore assez de données",
      detail: `${sampleSize} rendez-vous sur les 90 derniers jours. Les recommandations apparaissent à partir de ${MIN_SAMPLE} rendez-vous, pour rester fiables.`,
    });
  } else {
    const quiet = quietSlots[0];
    if (quiet && avgPerOpenCell >= 1 && quiet.count <= avgPerOpenCell * 0.25) {
      recommendations.push({
        id: "quiet",
        tone: "opportunity",
        title: "Un créneau à remplir",
        detail: `Votre période la plus calme est ${slotLabel(quiet.weekday, quiet.hour)} : ${quiet.count} rendez-vous en 90 jours, contre ${avgPerOpenCell.toFixed(1).replace(".", ",")} en moyenne par heure d'ouverture. Une offre ciblée sur ce créneau peut l'occuper.`,
      });
    }
    const peak = peakSlots[0];
    if (peak && avgPerOpenCell > 0 && peak.count >= avgPerOpenCell * 2 && peak.count >= 4) {
      recommendations.push({
        id: "peak",
        tone: "opportunity",
        title: "Forte demande à certains horaires",
        detail: `${capitalizeFirst(slotLabel(peak.weekday, peak.hour))} est votre heure la plus demandée (${peak.count} rendez-vous en 90 jours, ${Math.round(peak.count / avgPerOpenCell)} fois la moyenne). Ajouter des disponibilités à ce moment-là peut éviter de perdre des clients.`,
        action: { label: "Gérer les horaires", href: "/tableau-de-bord/parametres/horaires" },
      });
    }
    if (cancellations.count >= 3 && cancellations.rate >= 10) {
      if (!input.automations.reminders) {
        recommendations.push({
          id: "reminders",
          tone: "warning",
          title: "Réduire les annulations",
          detail: `${cancellations.rate} % de vos rendez-vous des 90 derniers jours ont été annulés (${cancellations.count}). Les rappels automatiques avant rendez-vous sont désactivés.`,
          action: { label: "Activer les rappels", href: "/tableau-de-bord/autopilot" },
        });
      }
      if (input.automations.waitlistAvailable && !input.automations.waitlist) {
        recommendations.push({
          id: "waitlist",
          tone: "opportunity",
          title: "Récupérer les créneaux annulés",
          detail: `${cancellations.count} annulations en 90 jours, dont ${cancellations.late} moins de 24 h avant. La liste d'attente intelligente peut reproposer automatiquement ces créneaux.`,
          action: { label: "Activer la liste d'attente", href: "/tableau-de-bord/autopilot" },
        });
      } else if (cancellations.late >= 3) {
        recommendations.push({
          id: "late",
          tone: "warning",
          title: "Annulations de dernière minute",
          detail: `${cancellations.late} annulations sont intervenues moins de 24 h avant le rendez-vous sur les 90 derniers jours. Un délai d'annulation en ligne plus long peut les limiter.`,
          action: { label: "Régler le délai", href: "/tableau-de-bord/parametres/reservation" },
        });
      }
    }
    if (noShows.length >= 3 && cancellations.noShowRate >= 5) {
      recommendations.push({
        id: "noshow",
        tone: "warning",
        title: "Rendez-vous non honorés",
        detail: `${noShows.length} clients ne se sont pas présentés en 90 jours (${cancellations.noShowRate} % des rendez-vous maintenus).${input.automations.reminders ? "" : " Les rappels automatiques sont désactivés."}`,
      });
    }
    if (trend.changePct !== null && trend.prev30 >= 5 && Math.abs(trend.changePct) >= 20) {
      const down = trend.changePct < 0;
      recommendations.push({
        id: "trend",
        tone: down ? "warning" : "info",
        title: down ? "Baisse d'activité" : "Activité en hausse",
        detail: `${trend.last30} rendez-vous sur les 30 derniers jours contre ${trend.prev30} sur les 30 précédents (${down ? "" : "+"}${trend.changePct} %).`,
      });
    }
    const top = services[0];
    if (top && services.length > 1 && top.share >= 40) {
      recommendations.push({
        id: "top-service",
        tone: "info",
        title: "Une prestation phare",
        detail: `« ${top.name} » représente ${top.share} % de vos rendez-vous (${top.count} en 90 jours). Mettez-la en avant sur votre page de réservation.`,
        action: { label: "Gérer les prestations", href: "/tableau-de-bord/services" },
      });
    }
  }
  if (lapsed.length) {
    recommendations.push({
      id: "lapsed",
      tone: "opportunity",
      title: "Clients réguliers à relancer",
      detail: `${lapsed.length} client${lapsed.length > 1 ? "s" : ""} régulier${lapsed.length > 1 ? "s" : ""} n'${lapsed.length > 1 ? "ont" : "a"} pas repris rendez-vous depuis plus longtemps que d'habitude (par exemple ${lapsed[0].name}, dernière visite il y a ${lapsed[0].daysSince} jours).`,
    });
  }

  return {
    sampleSize,
    enoughData,
    heatmap,
    peakSlots,
    quietSlots: avgPerOpenCell > 0 ? quietSlots : [],
    byDay,
    services,
    cancellations,
    trend,
    regulars,
    lapsed,
    recommendations,
  };
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
