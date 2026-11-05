import { TZDate } from "@date-fns/tz";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { member, organization, staff, user, workingHours } from "@/db/schema";
import { loadOrgContext, type OrgContext } from "@/server/auth/session";
import { createOrganization } from "@/server/organizations/service";

let n = 0;
export const uid = () =>
  `${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export async function makeUser(name = "Camille Martin") {
  const [u] = await db
    .insert(user)
    .values({
      name,
      email: `${uid()}@example.com`,
      emailVerified: true,
      termsAcceptedAt: new Date(),
      termsVersion: "test",
    })
    .returning();
  return u;
}

/** Entreprise prête à réserver : propriétaire, horaires 7j/7 de 9 h à 18 h (pour des tests stables). */
export async function makeOrg(opts: { plan?: "free" | "starter" | "pro" } = {}) {
  const owner = await makeUser();
  const org = await createOrganization(owner, {
    name: `Salon ${uid()}`,
    slug: `salon-${uid()}`,
    activity: "coiffure",
    timezone: "Europe/Paris",
  });
  if (opts.plan && opts.plan !== "free") {
    await db
      .update(organization)
      .set({ plan: opts.plan, subscriptionStatus: "active" })
      .where(eq(organization.id, org.id));
  }
  await db.update(organization).set({ minNoticeMinutes: 0 }).where(eq(organization.id, org.id));
  const [m] = await db.select().from(member).where(eq(member.organizationId, org.id));
  const [s] = await db.select().from(staff).where(eq(staff.memberId, m.id));
  await db.delete(workingHours).where(eq(workingHours.staffId, s.id));
  await db.insert(workingHours).values(
    [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
      organizationId: org.id,
      staffId: s.id,
      weekday,
      startMinute: 540,
      endMinute: 1080,
    })),
  );
  return ctxFor(owner, org.id);
}

export async function ctxFor(
  u: { id: string; name: string; email: string },
  organizationId: string,
): Promise<OrgContext> {
  const [m] = await db.select().from(member).where(eq(member.organizationId, organizationId));
  const [mine] = await db.select().from(member).where(eq(member.userId, u.id));
  const target = mine?.organizationId === organizationId ? mine : m;
  const [org] = await db.select().from(organization).where(eq(organization.id, organizationId));
  return loadOrgContext(u, {
    organizationId,
    organizationName: org.name,
    slug: org.slug,
    role: target.role,
    memberId: target.id,
  });
}

/** Dans `daysAhead` jours, à l'heure locale de Paris donnée (instant UTC). */
export function nextDayAt(hour: number, minute = 0, daysAhead = 2) {
  const now = new TZDate(Date.now(), "Europe/Paris");
  return new Date(
    new TZDate(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysAhead,
      hour,
      minute,
      0,
      "Europe/Paris",
    ).getTime(),
  );
}
