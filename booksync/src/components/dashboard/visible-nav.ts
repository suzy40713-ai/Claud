import "server-only";
import { can, type Role } from "@/domain/permissions";
import { env } from "@/lib/env";
import { NAV_ITEMS } from "./nav-config";

/**
 * Entrées du menu visibles pour ce rôle. L'assistant n'apparaît que s'il est activé, les
 * entrées du module rendez-vous seulement si l'entreprise l'utilise.
 */
export function visibleNavItems(role: Role, opts: { bookingModule?: boolean } = {}) {
  const assistant = Boolean(env.ANTHROPIC_API_KEY);
  const booking = opts.bookingModule ?? true;
  return NAV_ITEMS.filter(
    (i) =>
      (!i.permission || can(role, i.permission)) &&
      (!i.requiresAssistant || assistant) &&
      (!i.bookingModule || booking),
  );
}
