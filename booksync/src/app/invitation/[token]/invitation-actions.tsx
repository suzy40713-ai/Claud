"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { acceptInvitationAction, declineInvitationAction } from "./actions";

export function InvitationActions({
  token,
  signOutOnly = false,
}: {
  token: string;
  signOutOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

  if (signOutOnly) {
    return (
      <Button
        size="lg"
        variant="secondary"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await authClient.signOut();
            router.refresh();
          })
        }
      >
        {pending ? <Spinner /> : null}
        Changer de compte
      </Button>
    );
  }

  if (declined)
    return <Alert className="mt-6">Invitation refusée. Vous pouvez fermer cette page.</Alert>;

  return (
    <div className="mt-7 grid gap-3">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await acceptInvitationAction(token);
            if (res && !res.ok) setError(res.error);
          })
        }
      >
        {pending ? <Spinner /> : null}
        Accepter l&apos;invitation
      </Button>
      <Button
        size="lg"
        variant="ghost"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await declineInvitationAction(token);
            if (res.ok) setDeclined(true);
            else setError(res.error);
          })
        }
      >
        Refuser
      </Button>
    </div>
  );
}
