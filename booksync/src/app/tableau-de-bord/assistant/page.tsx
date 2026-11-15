import type { Metadata } from "next";
import { Suspense } from "react";
import { UpgradeNotice } from "@/components/settings/section";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOrg } from "@/server/auth/session";
import { getAssistantState } from "@/server/assistant/service";
import { AssistantChat } from "./chat";

export const metadata: Metadata = { title: "Assistant" };

async function Content() {
  const ctx = await requireOrg();
  const state = await getAssistantState(ctx);
  if (!state.allowed) {
    return (
      <div className="grid gap-4">
        <UpgradeNotice feature="L'assistant BookSync" />
        <p className="text-sm text-muted-foreground">
          Posez vos questions en français (« Quels sont mes rendez-vous demain ? », « Décale le
          rendez-vous de Thomas à 15 h ») : l&apos;assistant répond à partir de vos vraies données
          et vous demande toujours confirmation avant toute modification.
        </p>
      </div>
    );
  }
  const disabledReason = state.configured
    ? state.usage && state.usage.questionsThisMonth >= state.usage.monthlyLimit
      ? "Quota mensuel atteint"
      : null
    : "Assistant pas encore activé";
  return (
    <div className="grid gap-4">
      {!state.configured ? (
        <Alert variant="info">
          L&apos;assistant n&apos;est pas encore activé. Il repose sur Claude Haiku (Anthropic), un
          service payant à l&apos;usage : il sera disponible dès que la clé d&apos;API aura été
          ajoutée par l&apos;administrateur de BookSync.
        </Alert>
      ) : null}
      <AssistantChat initial={state.messages} disabledReason={disabledReason} />
      {state.usage ? (
        <p className="text-center text-xs text-muted-foreground" data-testid="assistant-usage">
          {state.usage.questionsThisMonth} / {state.usage.monthlyLimit} questions ce mois-ci pour
          votre entreprise · {state.usage.questionsToday} / {state.usage.dailyLimit} pour vous
          aujourd&apos;hui
        </p>
      ) : null}
    </div>
  );
}

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        title="Assistant"
        description="Interrogez vos rendez-vous en français. Aucune modification sans votre confirmation."
      />
      <Suspense fallback={<Skeleton className="h-[60dvh]" />}>
        <Content />
      </Suspense>
    </>
  );
}
