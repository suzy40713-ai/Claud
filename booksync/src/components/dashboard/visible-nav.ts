import "server-only";
import { can, type Role } from "@/domain/permissions";
import { env } from "@/lib/env";
import { NAV_ITEMS } from "./nav-config";

/** Entrées du menu visibles pour ce rôle (l'assistant n'apparaît que s'il est activé). */
export function visibleNavItems(role: Role) {
  const assistant = Boolean(env.ANTHROPIC_API_KEY);
  return NAV_ITEMS.filter(
    (i) => (!i.permission || can(role, i.permission)) && (!i.requiresAssistant || assistant),
  );
}
