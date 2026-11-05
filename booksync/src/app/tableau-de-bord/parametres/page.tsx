import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { can } from "@/domain/permissions";
import { requireOrg } from "@/server/auth/session";
import { SETTINGS_TABS } from "./layout";

async function Redirect(): Promise<null> {
  const ctx = await requireOrg();
  const first = SETTINGS_TABS.find((t) => !t.permission || can(ctx.role, t.permission))!;
  redirect(first.href as Route);
}

export default function SettingsIndex() {
  return (
    <Suspense>
      <Redirect />
    </Suspense>
  );
}
