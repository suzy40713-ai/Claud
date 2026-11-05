import type { Metadata } from "next";
import { Suspense } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { account } from "@/db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccountDeletionImpact } from "@/server/account";
import { requireOrg } from "@/server/auth/session";
import { AccountForms } from "./account-forms";

export const metadata: Metadata = { title: "Mon compte — Paramètres" };

async function Content() {
  const ctx = await requireOrg();
  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, ctx.userId), eq(account.providerId, "credential")))
    .limit(1);
  const owned = await getAccountDeletionImpact(ctx.userId);
  return (
    <AccountForms
      name={ctx.user.name}
      email={ctx.user.email}
      hasPassword={Boolean(credential)}
      ownedOrganizations={owned.map((o) => o.name)}
    />
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <Content />
    </Suspense>
  );
}
