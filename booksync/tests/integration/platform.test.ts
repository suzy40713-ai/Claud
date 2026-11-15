import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { organization } from "@/db/schema";
import { createAppointment } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import { listMyAppointments } from "@/server/customer-space";
import { directorySearchSchema, searchDirectory } from "@/server/directory";
import { updateBookingSettings, updateOrganizationInfo } from "@/server/organizations/settings";
import { makeOrg, nextDayAt, uid } from "./factory";

afterAll(() => pg.end());

async function listedOrg(
  opts: {
    activity?: string;
    city?: string;
    postalCode?: string;
    price?: number;
    listed?: boolean;
  } = {},
) {
  const ctx = await makeOrg({ plan: "starter" });
  const tag = uid();
  const svc = await createService(ctx, {
    name: `Coupe signature ${tag}`,
    durationMinutes: 30,
    priceCents: opts.price ?? 2500,
    staffIds: [ctx.staffId!],
  });
  await db
    .update(organization)
    .set({
      name: `Salon ${tag}`,
      activity: opts.activity ?? "coiffure",
      city: opts.city ?? "Quetigny",
      postalCode: opts.postalCode ?? "21800",
      listed: opts.listed ?? true,
    })
    .where(eq(organization.id, ctx.organization.id));
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ctx.organization.id));
  return { ctx, svc, org, tag };
}

const search = (params: Record<string, string>) =>
  searchDirectory(directorySearchSchema.parse(params));

describe("annuaire public", () => {
  it("ne montre que les établissements visibles, réservables, hors santé", async () => {
    const visible = await listedOrg();
    const hidden = await listedOrg({ listed: false });
    const health = await listedOrg({ activity: "kinesitherapie" });
    const closed = await listedOrg();
    await db
      .update(organization)
      .set({ bookingEnabled: false })
      .where(eq(organization.id, closed.org.id));

    const names = async (q: string) => (await search({ q })).results.map((r) => r.name);
    expect(await names(visible.tag)).toEqual([`Salon ${visible.tag}`]);
    expect(await names(hidden.tag)).toEqual([]);
    expect(await names(health.tag)).toEqual([]);
    expect(await names(closed.tag)).toEqual([]);
  });

  it("recherche par métier, ville, code postal, prestation, prix et disponibilité réelle", async () => {
    const a = await listedOrg({
      activity: "barbier",
      city: "Chenôve",
      postalCode: "21300",
      price: 1800,
    });
    const r1 = await search({ metier: "barbier", lieu: "Chenô", q: a.tag });
    expect(r1.results.map((r) => r.slug)).toEqual([a.org.slug]);
    expect((await search({ lieu: "213", q: a.tag })).results).toHaveLength(1);
    expect((await search({ lieu: "75001", q: a.tag })).results).toHaveLength(0);
    expect((await search({ metier: "coiffure", q: a.tag })).results).toHaveLength(0);
    // Recherche dans le nom des prestations.
    expect((await search({ q: `signature ${a.tag}` })).results).toHaveLength(1);
    // Prix : prestation la moins chère (18 €).
    expect((await search({ prixMax: "20", q: a.tag })).results).toHaveLength(1);
    expect((await search({ prixMax: "15", q: a.tag })).results).toHaveLength(0);

    // Disponibilité : créneaux réels (horaires de test 9 h – 18 h, 7 j/7).
    const week = await search({ dispo: "semaine", q: a.tag });
    expect(week.results).toHaveLength(1);
    expect(week.results[0].nextSlot).toBeInstanceOf(Date);
    expect(week.results[0].nextSlot!.getTime()).toBeGreaterThan(Date.now());
  });

  it("aucune donnée privée dans les résultats", async () => {
    const { tag, org, svc } = await listedOrg();
    await createAppointment({
      org,
      serviceId: svc.id,
      staffId: null,
      startsAt: nextDayAt(10),
      source: "online",
      customer: {
        firstName: "Privé",
        lastName: "Client",
        email: `${uid()}@example.com`,
        phone: null,
      },
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
    const [r] = (await search({ q: tag })).results;
    expect(Object.keys(r).sort()).toEqual(
      [
        "activity",
        "address",
        "city",
        "description",
        "logoUrl",
        "minPriceCents",
        "name",
        "nextSlot",
        "postalCode",
        "services",
        "servicesCount",
        "slug",
        "timezone",
      ].sort(),
    );
    expect(JSON.stringify(r)).not.toContain("Privé");
  });

  it("réglage du professionnel : refus pour une activité de santé, retrait automatique", async () => {
    const health = await listedOrg({ activity: "kinesitherapie", listed: false });
    const ctx = { ...health.ctx, organization: health.org };
    const base = {
      bookingEnabled: true,
      minNoticeMinutes: 0,
      maxAdvanceDays: 60,
      slotIntervalMinutes: 15,
      cancellationNoticeHours: 24,
    };
    await expect(updateBookingSettings(ctx, { ...base, listed: true })).rejects.toThrow(/santé/);

    const ok = await listedOrg({ listed: false });
    await updateBookingSettings({ ...ok.ctx, organization: ok.org }, { ...base, listed: true });
    const [listed] = await db.select().from(organization).where(eq(organization.id, ok.org.id));
    expect(listed.listed).toBe(true);
    await updateOrganizationInfo({ ...ok.ctx, organization: listed }, {
      name: listed.name,
      slug: listed.slug,
      activity: "kinesitherapie",
      timezone: listed.timezone,
    } as Parameters<typeof updateOrganizationInfo>[1]);
    const [after] = await db.select().from(organization).where(eq(organization.id, ok.org.id));
    expect(after.listed).toBe(false);
  });
});

describe("espace particulier", () => {
  it("retrouve ses rendez-vous dans tous les établissements, seulement avec un email vérifié", async () => {
    const email = `Lea.${uid()}@Example.com`;
    const a = await listedOrg();
    const b = await listedOrg();
    for (const { org, svc } of [a, b]) {
      await createAppointment({
        org,
        serviceId: svc.id,
        staffId: null,
        startsAt: nextDayAt(11),
        source: "online",
        customer: { firstName: "Léa", lastName: "Martin", email: email.toLowerCase(), phone: null },
        actor: { kind: "customer" },
        enforceSchedule: true,
      });
    }
    // Rendez-vous d'une autre personne : jamais visible.
    await createAppointment({
      org: a.org,
      serviceId: a.svc.id,
      staffId: null,
      startsAt: nextDayAt(14),
      source: "online",
      customer: {
        firstName: "Autre",
        lastName: "Client",
        email: `${uid()}@example.com`,
        phone: null,
      },
      actor: { kind: "customer" },
      enforceSchedule: true,
    });

    const mine = await listMyAppointments({ email, emailVerified: true });
    expect(mine.upcoming.map((x) => x.orgSlug).sort()).toEqual([a.org.slug, b.org.slug].sort());
    expect(mine.upcoming.every((x) => x.manageToken.startsWith(x.id))).toBe(true);
    expect(JSON.stringify(mine)).not.toContain("Autre");
    expect(JSON.stringify(mine)).not.toMatch(/internalNote|customerNote/);

    expect(await listMyAppointments({ email, emailVerified: false })).toEqual({
      upcoming: [],
      past: [],
    });
  });
});
