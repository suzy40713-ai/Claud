import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { integrations } from "@/lib/env";

/** Error whose message is safe and meant to be shown to the end user. */
export class UserFacingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unauthorized"
      | "forbidden"
      | "quota_exceeded"
      | "plan_required"
      | "not_configured"
      | "invalid_input"
      | "upstream"
      | "disabled" = "invalid_input"
  ) {
    super(message);
    this.name = "UserFacingError";
  }
}

/** Persists technical errors for the admin "Erreurs" screen. Never throws. */
export async function logError(context: string, error: unknown, userId?: string | null, details?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, error);
  if (!integrations.supabase() || !integrations.supabaseAdmin()) return;
  try {
    await createAdminClient()
      .from("app_errors")
      .insert({ context, message: message.slice(0, 2000), user_id: userId ?? null, details: details ?? null });
  } catch {
    // Logging must never break the request.
  }
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; code?: UserFacingError["code"] };

/** Converts any thrown error into a friendly action result. */
export async function toActionError(context: string, error: unknown, userId?: string | null) {
  if (error instanceof UserFacingError) {
    return { ok: false as const, error: error.message, code: error.code };
  }
  await logError(context, error, userId);
  return {
    ok: false as const,
    error: "Une erreur inattendue est survenue. Réessaie dans quelques instants — notre équipe a été notifiée.",
  };
}
