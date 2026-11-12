import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { and, asc, eq, ilike, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { appointment, autopilotAction, customer, service, staff } from "@/db/schema";
import { ASSISTANT_LIMITS } from "@/domain/assistant/limits";
import {
  addDays,
  isSlotAvailable,
  localDateOf,
  localMinuteToInstant,
} from "@/domain/availability/engine";
import { can } from "@/domain/permissions";
import { formatInTz, formatTime } from "@/lib/format";
import { listAppointmentsInRange } from "@/server/appointments";
import type { OrgContext } from "@/server/auth/session";
import { buildDailySummary } from "@/server/autopilot/daily-summary";
import {
  getAvailability,
  loadAvailabilityInput,
  staffForService,
} from "@/server/booking/availability";
import { getInsights } from "@/server/insights";

/**
 * Outils de l'assistant : la SEULE manière dont le modèle accède aux données.
 * - Aucune requête libre : chaque outil est une fonction serveur fixe, filtrée par entreprise et par rôle.
 * - Les entrées du modèle sont validées (zod) avant exécution.
 * - Les modifications ne sont jamais exécutées ici : elles créent une action « à confirmer ».
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

type ToolDef<S extends z.ZodType> = {
  definition: Anthropic.Tool;
  schema: S;
  run: (ctx: OrgContext, input: z.infer<S>) => Promise<unknown>;
};

function tool<S extends z.ZodType>(def: ToolDef<S>) {
  return def;
}

const dayBounds = (ctx: OrgContext, date: string) => ({
  start: localMinuteToInstant(date, 0, ctx.organization.timezone)!,
  end: localMinuteToInstant(addDays(date, 1), 0, ctx.organization.timezone)!,
});

const STATUS_FR: Record<string, string> = {
  confirmed: "confirmé",
  cancelled: "annulé",
  completed: "honoré",
  no_show: "absent",
};

function apptView(ctx: OrgContext, a: Awaited<ReturnType<typeof listAppointmentsInRange>>[number]) {
  const tz = ctx.organization.timezone;
  return {
    id: a.id,
    date: localDateOf(a.startsAt, tz),
    heure: formatTime(a.startsAt, tz),
    fin: formatTime(a.endsAt, tz),
    client: `${a.customerFirstName} ${a.customerLastName}`,
    prestation: a.serviceName,
    employe: a.staffName,
    statut: STATUS_FR[a.status] ?? a.status,
  };
}

const listAppointments = tool({
  definition: {
    name: "lister_rendez_vous",
    description:
      "Liste les rendez-vous de l'entreprise entre deux dates locales incluses (30 jours maximum). Un employé ne voit que les siens.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        date_debut: { type: "string", description: "AAAA-MM-JJ" },
        date_fin: { type: "string", description: "AAAA-MM-JJ, incluse" },
        inclure_annules: { type: "boolean" },
      },
      required: ["date_debut", "date_fin", "inclure_annules"],
      additionalProperties: false,
    },
  },
  schema: z.object({ date_debut: isoDate, date_fin: isoDate, inclure_annules: z.boolean() }),
  run: async (ctx, i) => {
    const from = i.date_debut <= i.date_fin ? i.date_debut : i.date_fin;
    let to = i.date_debut <= i.date_fin ? i.date_fin : i.date_debut;
    if (to > addDays(from, 30)) to = addDays(from, 30);
    const rows = await listAppointmentsInRange(
      ctx,
      dayBounds(ctx, from).start,
      dayBounds(ctx, to).end,
    );
    const list = rows.filter((r) => i.inclure_annules || r.status !== "cancelled");
    return {
      periode: { du: from, au: to },
      nombre: list.length,
      rendez_vous: list.slice(0, 60).map((r) => apptView(ctx, r)),
      tronque: list.length > 60,
    };
  },
});

const freeSlots = tool({
  definition: {
    name: "creneaux_libres",
    description:
      "Créneaux encore disponibles un jour donné pour une prestation (par défaut la plus courte réservable). Utilise le même moteur que la réservation en ligne.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "AAAA-MM-JJ" },
        prestation: {
          type: ["string", "null"],
          description: "Nom (ou partie du nom) de la prestation, ou null",
        },
      },
      required: ["date", "prestation"],
      additionalProperties: false,
    },
  },
  schema: z.object({ date: isoDate, prestation: z.string().max(80).nullable() }),
  run: async (ctx, i) => {
    const services = await db
      .select()
      .from(service)
      .where(
        and(
          eq(service.organizationId, ctx.organization.id),
          eq(service.isActive, true),
          isNull(service.deletedAt),
          i.prestation ? ilike(service.name, `%${i.prestation}%`) : undefined,
        ),
      )
      .orderBy(asc(service.durationMinutes))
      .limit(1);
    const svc = services[0];
    if (!svc) return { erreur: "Aucune prestation correspondante." };
    let staffIds = (await staffForService(db, ctx.organization.id, svc.id)).map((s) => s.id);
    if (!can(ctx.role, "appointments.manage_all"))
      staffIds = staffIds.filter((id) => id === ctx.staffId);
    const days = staffIds.length
      ? await getAvailability(ctx.organization, svc, staffIds, i.date, i.date)
      : [];
    const slots = days.flatMap((d) => d.slots);
    return {
      date: i.date,
      prestation: svc.name,
      duree_minutes: svc.durationMinutes,
      nombre_creneaux: slots.length,
      horaires: slots.map((s) => formatTime(s.start, ctx.organization.timezone)),
    };
  },
});

const findCustomerAppointments = tool({
  definition: {
    name: "rechercher_rendez_vous_client",
    description:
      "Rendez-vous à venir (et des 7 derniers jours) d'un client, recherché par prénom ou nom. Sert à retrouver l'identifiant d'un rendez-vous.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { nom: { type: "string", description: "Prénom et/ou nom du client" } },
      required: ["nom"],
      additionalProperties: false,
    },
  },
  schema: z.object({ nom: z.string().trim().min(2).max(80) }),
  run: async (ctx, i) => {
    const words = i.nom
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .slice(0, 3);
    const from = new Date(Date.now() - 7 * 86_400_000);
    const rows = await listAppointmentsInRange(ctx, from, new Date(Date.now() + 180 * 86_400_000));
    const match = rows.filter((r) =>
      words.every((w) =>
        `${r.customerFirstName} ${r.customerLastName}`
          .toLocaleLowerCase("fr")
          .normalize("NFD")
          .replace(/\p{M}/gu, "")
          .includes(w.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "")),
      ),
    );
    return { nombre: match.length, rendez_vous: match.slice(0, 20).map((r) => apptView(ctx, r)) };
  },
});

const insightsTool = tool({
  definition: {
    name: "analyse_activite",
    description:
      "Analyse des 90 derniers jours (forfait Pro, propriétaire/administrateur) : prestations les plus réservées, heures de pointe et creuses, annulations, tendance 30 jours, clients réguliers, clients qui n'ont pas repris rendez-vous, recommandations.",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  schema: z.object({}),
  run: async (ctx) => {
    if (!can(ctx.role, "stats.view"))
      return { erreur: "Réservé au propriétaire et aux administrateurs." };
    const i = await getInsights(ctx);
    const day = (d: number) =>
      ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"][d - 1];
    return {
      donnees_suffisantes: i.enoughData,
      rendez_vous_90_jours: i.sampleSize,
      prestations: i.services.slice(0, 8).map((s) => ({
        nom: s.name,
        rendez_vous: s.count,
        part_pourcent: s.share,
        chiffre_affaires_euros: s.revenueCents / 100,
      })),
      heures_de_pointe: i.peakSlots.map((s) => `${day(s.weekday)} ${s.hour} h (${s.count})`),
      heures_creuses: i.quietSlots.map((s) => `${day(s.weekday)} ${s.hour} h (${s.count})`),
      annulations: i.cancellations,
      tendance: i.trend,
      clients_reguliers: i.regulars.slice(0, 15).map((c) => ({ nom: c.name, visites: c.visits })),
      clients_sans_nouveau_rendez_vous: i.lapsed.slice(0, 20).map((c) => ({
        nom: c.name,
        visites: c.visits,
        derniere_visite_il_y_a_jours: c.daysSince,
        frequence_habituelle_jours: c.avgIntervalDays,
      })),
      recommandations: i.recommendations.map((r) => `${r.title} : ${r.detail}`),
    };
  },
});

const dayPlan = tool({
  definition: {
    name: "preparer_planning",
    description:
      "Prépare le planning d'un jour : rendez-vous, créneaux libres, annulations récentes et demandes en attente.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { date: { type: "string", description: "AAAA-MM-JJ" } },
      required: ["date"],
      additionalProperties: false,
    },
  },
  schema: z.object({ date: isoDate }),
  run: async (ctx, i) => {
    const { start, end } = dayBounds(ctx, i.date);
    const rows = (await listAppointmentsInRange(ctx, start, end)).filter(
      (r) => r.status !== "cancelled",
    );
    const tz = ctx.organization.timezone;
    const free = await freeSlots.run(ctx, { date: i.date, prestation: null });
    const summary = can(ctx.role, "appointments.manage_all")
      ? await buildDailySummary(ctx.organization)
      : null;
    return {
      date: i.date,
      jour: formatInTz(start, tz, "EEEE d MMMM"),
      rendez_vous: rows.map((r) => apptView(ctx, r)),
      creneaux_libres: free,
      annulations_24h: summary?.cancellations ?? [],
      liste_attente: summary?.waitlist ?? null,
    };
  },
});

/* ───────────── Modifications : proposition seulement, jamais d'exécution ───────────── */

async function scopedAppointment(ctx: OrgContext, id: string) {
  const [row] = await db
    .select({
      appt: appointment,
      firstName: customer.firstName,
      lastName: customer.lastName,
      staffName: staff.displayName,
    })
    .from(appointment)
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .innerJoin(staff, eq(staff.id, appointment.staffId))
    .where(
      and(
        eq(appointment.id, id),
        eq(appointment.organizationId, ctx.organization.id),
        can(ctx.role, "appointments.manage_all")
          ? undefined
          : ctx.staffId
            ? eq(appointment.staffId, ctx.staffId)
            : sql`false`,
      ),
    )
    .limit(1);
  return row ?? null;
}

async function createPending(
  ctx: OrgContext,
  kind: "assistant.reschedule" | "assistant.cancel",
  summary: string,
  payload: Record<string, unknown>,
) {
  const [action] = await db
    .insert(autopilotAction)
    .values({
      organizationId: ctx.organization.id,
      source: "assistant",
      kind,
      status: "pending",
      summary,
      payload,
      actorUserId: ctx.userId,
      expiresAt: new Date(Date.now() + ASSISTANT_LIMITS.confirmationMinutes * 60_000),
    })
    .returning();
  return action;
}

const proposeReschedule = tool({
  definition: {
    name: "proposer_deplacement",
    description:
      "Prépare le déplacement d'un rendez-vous (identifiant obtenu avec un autre outil) à une nouvelle date et heure locales. N'EXÉCUTE RIEN : crée une demande que l'utilisateur doit confirmer avec un bouton.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        rendez_vous_id: { type: "string" },
        date: { type: "string", description: "AAAA-MM-JJ" },
        heure: { type: "string", description: "HH:MM (24 h)" },
      },
      required: ["rendez_vous_id", "date", "heure"],
      additionalProperties: false,
    },
  },
  schema: z.object({ rendez_vous_id: z.uuid(), date: isoDate, heure: localTime }),
  run: async (ctx, i) => {
    const row = await scopedAppointment(ctx, i.rendez_vous_id);
    if (!row) return { erreur: "Rendez-vous introuvable." };
    if (row.appt.status !== "confirmed") return { erreur: "Ce rendez-vous n'est plus modifiable." };
    const tz = ctx.organization.timezone;
    const [h, m] = i.heure.split(":").map(Number);
    const startsAt = localMinuteToInstant(i.date, h * 60 + m, tz);
    if (!startsAt) return { erreur: "Cet horaire n'existe pas (changement d'heure)." };
    if (startsAt <= new Date()) return { erreur: "Cet horaire est déjà passé." };
    // Vérification indicative (la vérification définitive a lieu à la confirmation).
    const duration = row.appt.endsAt.getTime() - row.appt.startsAt.getTime();
    const buffer = row.appt.blockedUntil.getTime() - row.appt.endsAt.getTime();
    const input = await loadAvailabilityInput(
      db,
      ctx.organization,
      { durationMinutes: duration / 60_000, bufferAfterMinutes: buffer / 60_000 },
      [row.appt.staffId],
      i.date,
      i.date,
      { excludeAppointmentId: row.appt.id },
    );
    const withinHours = isSlotAvailable(input, startsAt, row.appt.staffId);
    const client = `${row.firstName} ${row.lastName}`;
    const before = formatInTz(row.appt.startsAt, tz, "EEE d MMM 'à' HH:mm");
    const after = formatInTz(startsAt, tz, "EEE d MMM 'à' HH:mm");
    const action = await createPending(
      ctx,
      "assistant.reschedule",
      `Déplacer le rendez-vous de ${client} (${row.appt.serviceName}, avec ${row.staffName}) du ${before} au ${after}`,
      { appointmentId: row.appt.id, startsAt: startsAt.toISOString(), withinHours },
    );
    return {
      action_id: action.id,
      statut: "en attente de confirmation par l'utilisateur",
      recapitulatif: action.summary,
      avertissement: withinHours
        ? null
        : "Ce nouvel horaire est en dehors des disponibilités habituelles ou chevauche un autre rendez-vous : la confirmation pourra être refusée.",
    };
  },
});

const proposeCancel = tool({
  definition: {
    name: "proposer_annulation",
    description:
      "Prépare l'annulation d'un rendez-vous (identifiant obtenu avec un autre outil). N'EXÉCUTE RIEN : crée une demande que l'utilisateur doit confirmer avec un bouton. Le client sera prévenu selon les automatisations.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        rendez_vous_id: { type: "string" },
        motif: { type: ["string", "null"] },
      },
      required: ["rendez_vous_id", "motif"],
      additionalProperties: false,
    },
  },
  schema: z.object({ rendez_vous_id: z.uuid(), motif: z.string().max(200).nullable() }),
  run: async (ctx, i) => {
    const row = await scopedAppointment(ctx, i.rendez_vous_id);
    if (!row) return { erreur: "Rendez-vous introuvable." };
    if (row.appt.status !== "confirmed")
      return { erreur: "Ce rendez-vous est déjà annulé ou terminé." };
    const when = formatInTz(row.appt.startsAt, ctx.organization.timezone, "EEE d MMM 'à' HH:mm");
    const action = await createPending(
      ctx,
      "assistant.cancel",
      `Annuler le rendez-vous de ${row.firstName} ${row.lastName} (${row.appt.serviceName}) du ${when}`,
      { appointmentId: row.appt.id, reason: i.motif },
    );
    return {
      action_id: action.id,
      statut: "en attente de confirmation par l'utilisateur",
      recapitulatif: action.summary,
    };
  },
});

export const ASSISTANT_TOOLS = [
  listAppointments,
  freeSlots,
  findCustomerAppointments,
  dayPlan,
  insightsTool,
  proposeReschedule,
  proposeCancel,
] as const;

/** Exécute un outil demandé par le modèle, après validation de son entrée. */
export async function runTool(ctx: OrgContext, name: string, input: unknown) {
  const t = ASSISTANT_TOOLS.find((x) => x.definition.name === name);
  if (!t) return { result: { erreur: `Outil inconnu : ${name}` }, isError: true };
  const parsed = (t.schema as z.ZodType).safeParse(input);
  if (!parsed.success) return { result: { erreur: "Paramètres invalides." }, isError: true };
  try {
    const result = await (t.run as (c: OrgContext, i: unknown) => Promise<unknown>)(
      ctx,
      parsed.data,
    );
    const actionId =
      result && typeof result === "object" && "action_id" in result
        ? String((result as { action_id: string }).action_id)
        : null;
    return { result, isError: false, actionId };
  } catch (error) {
    console.error("[assistant] outil en erreur", name, error);
    const message =
      error instanceof Error && error.name === "ForbiddenError" ? error.message : "Erreur interne.";
    return { result: { erreur: message }, isError: true };
  }
}
