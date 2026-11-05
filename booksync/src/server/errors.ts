import { ZodError } from "zod";
import { PlanLimitError } from "@/domain/billing/plans";
import { ForbiddenError } from "@/domain/permissions";

/** Erreur métier affichable telle quelle à l'utilisateur. */
export class UserError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "UserError";
  }
}

export class NotFoundError extends UserError {
  constructor(message = "Élément introuvable.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; limit?: string };

export function zodFieldErrors(error: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}

/** Exécute une action serveur et convertit les erreurs connues en résultat affichable. */
export async function runAction<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn(), message };
  } catch (error) {
    // Les redirections / notFound de Next doivent être relancées.
    if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_")) {
      throw error;
    }
    if (error instanceof ZodError) {
      const fieldErrors = zodFieldErrors(error);
      return { ok: false, error: "Certains champs sont invalides.", fieldErrors };
    }
    if (error instanceof UserError) return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    if (error instanceof ForbiddenError) return { ok: false, error: error.message };
    if (error instanceof PlanLimitError) return { ok: false, error: error.message, limit: error.kind };
    console.error("[action] erreur inattendue", error);
    return { ok: false, error: "Une erreur inattendue est survenue. Réessayez dans un instant." };
  }
}

/** Code d'erreur PostgreSQL (violation d'unicité 23505, d'exclusion 23P01…). */
export function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}
