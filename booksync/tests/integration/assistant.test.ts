import { afterAll, describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { appointment, assistantUsage, autopilotAction, member, organization } from "@/db/schema";
import { ASSISTANT_LIMITS, monthKey } from "@/domain/assistant/limits";
import { addDays, localDateOf } from "@/domain/availability/engine";
import {
  askAssistant,
  decideAssistantAction,
  getAssistantState,
  type MessagesClient,
} from "@/server/assistant/service";
import { createAppointment } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import { ctxFor, makeOrg, makeUser, nextDayAt, uid } from "./factory";

afterAll(() => pg.end());

type Step = (req: Anthropic.MessageCreateParamsNonStreaming) => Partial<Anthropic.Message>;

/** Client de test : réponses scriptées, requêtes enregistrées (aucun appel réseau, aucun coût). */
function scripted(steps: Step[]) {
  const requests: Anthropic.MessageCreateParamsNonStreaming[] = [];
  const client: MessagesClient = {
    messages: {
      create: (async (req: Anthropic.MessageCreateParamsNonStreaming) => {
        requests.push(structuredClone(req));
        const step = steps[Math.min(requests.length - 1, steps.length - 1)];
        return {
          id: `msg_${requests.length}`,
          type: "message",
          role: "assistant",
          model: req.model,
          stop_reason: "end_turn",
          content: [],
          usage: { input_tokens: 2000, output_tokens: 300 },
          ...step(req),
        } as Anthropic.Message;
      }) as unknown as MessagesClient["messages"]["create"],
    },
  };
  return { client, requests };
}

const toolUse = (name: string, input: unknown, id = `tu_${uid()}`): Partial<Anthropic.Message> => ({
  stop_reason: "tool_use",
  content: [{ type: "tool_use", id, name, input } as Anthropic.ToolUseBlock],
});
const text = (t: string): Partial<Anthropic.Message> => ({
  stop_reason: "end_turn",
  content: [{ type: "text", text: t, citations: null } as Anthropic.TextBlock],
});
/** Dernier résultat d'outil envoyé au modèle. */
function lastToolResult(req: Anthropic.MessageCreateParamsNonStreaming) {
  const last = req.messages.at(-1)!;
  const block = (last.content as Anthropic.ToolResultBlockParam[])[0];
  return JSON.parse(block.content as string);
}

async function setup(plan: "starter" | "pro" = "pro") {
  const ctx = await makeOrg({ plan });
  const svc = await createService(ctx, {
    name: "Coupe",
    durationMinutes: 30,
    priceCents: 2500,
    staffIds: [ctx.staffId!],
  });
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ctx.organization.id));
  const book = (firstName: string, hour: number) =>
    createAppointment({
      org,
      serviceId: svc.id,
      staffId: null,
      startsAt: nextDayAt(hour, 0, 1),
      source: "manual",
      customer: { firstName, lastName: "Client", email: `${uid()}@example.com`, phone: null },
      actor: { kind: "staff", email: ctx.user.email },
      enforceSchedule: false,
    });
  return { ctx, svc, org, book };
}

describe("assistant BookSync", () => {
  it("réservé au forfait Pro ; désactivé tant que la clé d'API n'est pas fournie", async () => {
    const starter = await setup("starter");
    await expect(askAssistant(starter.ctx, "Bonjour")).rejects.toThrow(/forfait Pro/);
    const pro = await setup();
    await expect(askAssistant(pro.ctx, "Bonjour")).rejects.toThrow(/pas encore activé/);
    const state = await getAssistantState(pro.ctx);
    expect(state).toMatchObject({ configured: false, allowed: true });
  });

  it("répond à partir des vraies données via les outils, et compte le coût réel", async () => {
    const { ctx, book } = await setup();
    await book("Thomas", 10);
    await book("Julie", 14);
    const tomorrow = addDays(localDateOf(new Date(), "Europe/Paris"), 1);
    let seen: { nombre: number; rendez_vous: Array<{ client: string; heure: string }> } | null =
      null;
    const { client, requests } = scripted([
      () =>
        toolUse("lister_rendez_vous", {
          date_debut: tomorrow,
          date_fin: tomorrow,
          inclure_annules: false,
        }),
      (req) => {
        seen = lastToolResult(req);
        return text(`Vous avez ${seen!.nombre} rendez-vous demain.`);
      },
    ]);
    const res = await askAssistant(ctx, "Quels sont mes rendez-vous demain ?", { client });
    expect(res.content).toBe("Vous avez 2 rendez-vous demain.");
    expect(seen!.rendez_vous.map((r) => [r.client, r.heure])).toEqual([
      ["Thomas Client", "10:00"],
      ["Julie Client", "14:00"],
    ]);
    // Requête : modèle Haiku, effort bas, sortie plafonnée, outils stricts, contexte daté.
    expect(requests[0]).toMatchObject({
      model: "claude-haiku-5-5",
      max_tokens: ASSISTANT_LIMITS.maxOutputTokens,
      output_config: { effort: "low" },
    });
    expect(requests[0].tools!.every((t) => (t as Anthropic.Tool).strict)).toBe(true);
    expect(JSON.stringify(requests[0].system)).toContain(tomorrow.slice(0, 4));
    const [usage] = await db
      .select()
      .from(assistantUsage)
      .where(eq(assistantUsage.organizationId, ctx.organization.id));
    // 2 appels × (2 000 × 0,10 $ + 300 × 0,50 $) / 1 M = 700 µ$
    expect(usage).toMatchObject({
      questions: 1,
      inputTokens: 4000,
      outputTokens: 600,
      costMicroUsd: 700,
    });
    const state = await getAssistantState(ctx);
    expect(state.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("déplacement : proposé, jamais exécuté sans confirmation, puis exécuté une seule fois", async () => {
    const { ctx, book } = await setup();
    const thomas = await book("Thomas", 10);
    const tomorrow = addDays(localDateOf(new Date(), "Europe/Paris"), 1);
    const { client } = scripted([
      () => toolUse("rechercher_rendez_vous_client", { nom: "Thomas" }),
      (req) => {
        const found = lastToolResult(req);
        return toolUse("proposer_deplacement", {
          rendez_vous_id: found.rendez_vous[0].id,
          date: tomorrow,
          heure: "15:00",
        });
      },
      (req) =>
        text(`Je vous propose : ${lastToolResult(req).recapitulatif}. Cliquez sur Confirmer.`),
    ]);
    const res = await askAssistant(ctx, "Décale le rendez-vous de Thomas à 15 heures.", { client });
    expect(res.actions).toHaveLength(1);
    expect(res.actions[0]).toMatchObject({ status: "pending", warning: null });
    expect(res.actions[0].summary).toMatch(/^Déplacer le rendez-vous de Thomas Client .* à 15:00$/);
    const [before] = await db.select().from(appointment).where(eq(appointment.id, thomas.id));
    expect(before.startsAt.getTime()).toBe(thomas.startsAt.getTime());

    await decideAssistantAction(ctx, res.actions[0].id, true);
    const [after] = await db.select().from(appointment).where(eq(appointment.id, thomas.id));
    expect(after.startsAt.getTime()).toBe(nextDayAt(15, 0, 1).getTime());
    await expect(decideAssistantAction(ctx, res.actions[0].id, true)).rejects.toThrow(
      /déjà été traitée/,
    );
  });

  it("annulation refusée par l'utilisateur : rien ne change ; proposition expirée : refusée", async () => {
    const { ctx, book } = await setup();
    const appt = await book("Léo", 11);
    const { client } = scripted([
      () => toolUse("proposer_annulation", { rendez_vous_id: appt.id, motif: null }),
      () => text("Annulation proposée."),
    ]);
    const first = await askAssistant(ctx, "Annule le rendez-vous de Léo", { client });
    await decideAssistantAction(ctx, first.actions[0].id, false);
    const [still] = await db.select().from(appointment).where(eq(appointment.id, appt.id));
    expect(still.status).toBe("confirmed");

    const second = await askAssistant(ctx, "Annule le rendez-vous de Léo", {
      client: scripted([
        () => toolUse("proposer_annulation", { rendez_vous_id: appt.id, motif: "Malade" }),
        () => text("Annulation proposée."),
      ]).client,
    });
    await db
      .update(autopilotAction)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(autopilotAction.id, second.actions[0].id));
    await expect(decideAssistantAction(ctx, second.actions[0].id, true)).rejects.toThrow(/expiré/);
    const [unchanged] = await db.select().from(appointment).where(eq(appointment.id, appt.id));
    expect(unchanged.status).toBe("confirmed");
  });

  it("isolation et rôles : jamais les données d'une autre entreprise ; l'employé ne voit que les siennes", async () => {
    const a = await setup();
    const b = await setup();
    const foreign = await b.book("Secret", 9);
    const { client } = scripted([
      () => toolUse("proposer_annulation", { rendez_vous_id: foreign.id, motif: null }),
      (req) => text(JSON.stringify(lastToolResult(req))),
    ]);
    const res = await askAssistant(a.ctx, "Annule ce rendez-vous", { client });
    expect(res.content).toContain("Rendez-vous introuvable");
    expect(res.actions).toHaveLength(0);
    // Une autre personne ne peut pas confirmer l'action d'autrui.
    const mine = await a.book("Zoé", 12);
    const proposal = await askAssistant(a.ctx, "Annule Zoé", {
      client: scripted([
        () => toolUse("proposer_annulation", { rendez_vous_id: mine.id, motif: null }),
        () => text("ok"),
      ]).client,
    });
    const employee = await makeUser("Employé");
    await db
      .insert(member)
      .values({ organizationId: a.ctx.organization.id, userId: employee.id, role: "employee" });
    const employeeCtx = await ctxFor(employee, a.ctx.organization.id);
    await expect(decideAssistantAction(employeeCtx, proposal.actions[0].id, true)).rejects.toThrow(
      /introuvable/,
    );
    // L'employé sans planning propre ne voit aucun rendez-vous de l'entreprise.
    const tomorrow = addDays(localDateOf(new Date(), "Europe/Paris"), 1);
    let listed: { nombre: number } | null = null;
    await askAssistant(employeeCtx, "Mes rendez-vous demain ?", {
      client: scripted([
        () =>
          toolUse("lister_rendez_vous", {
            date_debut: tomorrow,
            date_fin: tomorrow,
            inclure_annules: true,
          }),
        (req) => {
          listed = lastToolResult(req);
          return text("ok");
        },
      ]).client,
    });
    expect(listed!.nombre).toBe(0);
  });

  it("entrées invalides, boucle bornée, refus du modèle", async () => {
    const { ctx } = await setup();
    let error: unknown = null;
    await askAssistant(ctx, "test", {
      client: scripted([
        () => toolUse("lister_rendez_vous", { date_debut: "demain" }),
        (req) => {
          error = lastToolResult(req);
          return text("ok");
        },
      ]).client,
    });
    expect(error).toEqual({ erreur: "Paramètres invalides." });

    const loop = scripted([() => toolUse("analyse_activite", {})]);
    const res = await askAssistant(ctx, "boucle", { client: loop.client });
    expect(loop.requests).toHaveLength(ASSISTANT_LIMITS.maxModelCalls);
    expect(res.content).toMatch(/pas pu terminer/);

    const refused = await askAssistant(ctx, "hors sujet", {
      client: scripted([() => ({ stop_reason: "refusal", content: [] })]).client,
    });
    expect(refused.content).toMatch(/ne peux pas traiter/);
    await expect(askAssistant(ctx, "x".repeat(501), { client: loop.client })).rejects.toThrow(
      /500 caractères/,
    );
  });

  it("quotas : mensuel par entreprise, quotidien par utilisateur, plafond global de dépense", async () => {
    const { ctx } = await setup();
    const month = monthKey(new Date());
    const ok = () => scripted([() => text("ok")]).client;
    await db.insert(assistantUsage).values({
      organizationId: ctx.organization.id,
      month,
      questions: ASSISTANT_LIMITS.questionsPerMonth,
    });
    await expect(askAssistant(ctx, "Encore ?", { client: ok() })).rejects.toThrow(/300 questions/);
    await db
      .update(assistantUsage)
      .set({ questions: 0, costMicroUsd: 5_000_000 })
      .where(
        and(
          eq(assistantUsage.organizationId, ctx.organization.id),
          eq(assistantUsage.month, month),
        ),
      );
    await expect(askAssistant(ctx, "Encore ?", { client: ok() })).rejects.toThrow(
      /plafond de dépense/,
    );
    await db.update(assistantUsage).set({ costMicroUsd: 0 }).where(eq(assistantUsage.month, month));
  });
});
