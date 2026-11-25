import type { Metadata } from "next";
import { Suspense } from "react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";
import { getAssistantState } from "@/server/assistant/service";
import { AssistantChat } from "./chat";

export const metadata: Metadata = { title: "Assistant IA" };

async function Content() {
  const ctx = await requirePermission("marketing.manage");
  const state = await getAssistantState(ctx);
  const disabledReason = !state.configured
    ? "Assistant pas encore activé"
    : state.usage.today >= state.usage.limit
      ? "Questions du jour épuisées"
      : null;
  return (
    <div className="grid min-w-0 gap-4">
      {!state.configured ? (
        <Alert data-testid="assistant-disabled">
          L&apos;assistant n&apos;est pas encore activé sur BookSync. Tous les autres outils
          fonctionnent déjà.
        </Alert>
      ) : null}
      <AssistantChat initial={state.messages} disabledReason={disabledReason} />
      <p className="text-center text-xs text-muted-foreground" data-testid="assistant-usage">
        {state.usage.today} / {state.usage.limit} questions aujourd&apos;hui · réponses
        rédigées par une IA gratuite, à vérifier avant d&apos;agir
      </p>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        title="Assistant IA"
        description="Vos questions de marketing et de vente, avec les informations de vos produits."
      />
      <Suspense fallback={<Skeleton className="h-[60dvh]" />}>
        <Content />
      </Suspense>
    </>
  );
}
