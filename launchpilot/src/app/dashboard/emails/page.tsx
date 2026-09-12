import { Mail } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { getLatestReport, getReportBundle } from "@/lib/data/reports";
import type { EmailType } from "@/types/database";

const EMAIL_LABELS: Record<EmailType, string> = {
  launch: "Email de lancement",
  intro: "Email de présentation",
  follow_up: "Email de relance",
  recovery: "Email de récupération",
  loyalty: "Email de fidélisation",
};

export default async function EmailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const latest = await getLatestReport(supabase, user.id);

  if (!latest) {
    return (
      <div>
        <PageHeader title="Emails" description="Séquence d'emails prête à personnaliser." />
        <EmptyState
          icon={Mail}
          title="Aucun email généré"
          description="Génère ton plan marketing pour recevoir ta séquence d'emails."
          actionLabel="Créer mon plan"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  const { emails } = await getReportBundle(supabase, latest.id, user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Emails" description="5 emails prêts à copier et personnaliser." />

      <div className="grid gap-4 lg:grid-cols-2">
        {emails.map((email) => (
          <Card key={email.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{EMAIL_LABELS[email.email_type]}</Badge>
              </div>
              <p className="font-semibold">{email.subject}</p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{email.body}</p>
              <div className="flex justify-end border-t border-border pt-3">
                <CopyButton text={`Objet : ${email.subject}\n\n${email.body}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
