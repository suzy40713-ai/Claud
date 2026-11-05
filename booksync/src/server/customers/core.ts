import "server-only";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { customer } from "@/db/schema";
import { hasRoom, LIMIT_MESSAGES, PlanLimitError, type Plan } from "@/domain/billing/plans";
import { optionalEmail, optionalPhone, optionalText } from "@/domain/validation";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const customerInputSchema = z.object({
  firstName: z.string().trim().min(1, "Indiquez le prénom.").max(60, "60 caractères maximum."),
  lastName: z.string().trim().min(1, "Indiquez le nom.").max(60, "60 caractères maximum."),
  email: optionalEmail,
  phone: optionalPhone,
  notes: optionalText(2000, "Les notes"),
  emailOptIn: z.boolean().default(true),
});

export type CustomerInput = z.input<typeof customerInputSchema>;

/** Verrou transactionnel par entreprise : sérialise la création de clients (respect strict de la limite). */
export async function lockCustomers(tx: Tx, organizationId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`customers:${organizationId}`}, 0))`);
}

export async function assertCustomerRoom(tx: Tx, organizationId: string, plan: Plan) {
  if (plan.limits.customers === null) return;
  const [row] = await tx.select({ n: count() }).from(customer).where(eq(customer.organizationId, organizationId));
  if (!hasRoom(plan.limits.customers, row.n)) throw new PlanLimitError("customers", LIMIT_MESSAGES.customers(plan));
}

/**
 * Retrouve le client par email (insensible à la casse) ou le crée, dans la transaction appelante.
 * Les coordonnées manquantes sont complétées, jamais écrasées par une saisie publique.
 */
export async function findOrCreateCustomer(
  tx: Tx,
  organizationId: string,
  plan: Plan,
  input: { firstName: string; lastName: string; email: string | null; phone: string | null; emailOptIn?: boolean },
) {
  await lockCustomers(tx, organizationId);
  if (input.email) {
    const [existing] = await tx
      .select()
      .from(customer)
      .where(and(eq(customer.organizationId, organizationId), sql`lower(${customer.email}) = ${input.email.toLowerCase()}`))
      .limit(1);
    if (existing) {
      if (!existing.phone && input.phone) {
        await tx.update(customer).set({ phone: input.phone }).where(eq(customer.id, existing.id));
      }
      return existing;
    }
  }
  await assertCustomerRoom(tx, organizationId, plan);
  const [created] = await tx
    .insert(customer)
    .values({
      organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      emailOptIn: input.emailOptIn ?? true,
    })
    .returning();
  return created;
}
