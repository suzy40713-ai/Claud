/**
 * Matrice des permissions BookSync — source unique de vérité.
 * Utilisée côté serveur (contrôle de chaque action) et côté interface (affichage).
 */

export type Role = "owner" | "admin" | "employee";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  employee: "Employé",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Contrôle total : paramètres, abonnement, équipe et statistiques.",
  admin: "Gère les rendez-vous, les clients, les services et les employés.",
  employee: "Consulte son planning et gère ses propres rendez-vous.",
};

export type Permission =
  | "organization.update"
  | "organization.delete"
  | "billing.manage"
  | "team.view"
  | "team.invite_employee"
  | "team.invite_admin"
  | "team.change_role"
  | "team.remove_employee"
  | "team.remove_admin"
  | "staff.manage_all"
  | "services.manage"
  | "customers.manage"
  | "customers.view_all"
  | "appointments.manage_all"
  | "appointments.manage_own"
  | "schedule.manage_all"
  | "schedule.manage_own"
  | "closures.manage"
  | "stats.view"
  | "autopilot.view"
  | "autopilot.manage";

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set<Permission>([
    "organization.update",
    "organization.delete",
    "billing.manage",
    "team.view",
    "team.invite_employee",
    "team.invite_admin",
    "team.change_role",
    "team.remove_employee",
    "team.remove_admin",
    "staff.manage_all",
    "services.manage",
    "customers.manage",
    "customers.view_all",
    "appointments.manage_all",
    "appointments.manage_own",
    "schedule.manage_all",
    "schedule.manage_own",
    "closures.manage",
    "stats.view",
    "autopilot.view",
    "autopilot.manage",
  ]),
  admin: new Set<Permission>([
    "team.view",
    "team.invite_employee",
    "team.remove_employee",
    "staff.manage_all",
    "services.manage",
    "customers.manage",
    "customers.view_all",
    "appointments.manage_all",
    "appointments.manage_own",
    "schedule.manage_all",
    "schedule.manage_own",
    "closures.manage",
    "stats.view",
    "autopilot.view",
  ]),
  employee: new Set<Permission>(["appointments.manage_own", "schedule.manage_own"]),
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].has(permission);
}

export function isRole(value: unknown): value is Role {
  return value === "owner" || value === "admin" || value === "employee";
}

/** Peut-on inviter quelqu'un avec ce rôle ? (le rôle propriétaire ne s'invite jamais) */
export function canInviteRole(actor: Role, target: Role): boolean {
  if (target === "employee") return can(actor, "team.invite_employee");
  if (target === "admin") return can(actor, "team.invite_admin");
  return false;
}

/** Peut-on retirer ce membre ? Le propriétaire ne peut jamais être retiré ; on ne se retire pas soi-même ici. */
export function canRemoveMember(actor: Role, target: Role, isSelf: boolean): boolean {
  if (isSelf || target === "owner") return false;
  if (target === "admin") return can(actor, "team.remove_admin");
  return can(actor, "team.remove_employee");
}

/** Changement de rôle : seul le propriétaire, entre administrateur et employé. */
export function canChangeRole(actor: Role, from: Role, to: Role): boolean {
  if (from === "owner" || to === "owner" || from === to) return false;
  return can(actor, "team.change_role");
}

export class ForbiddenError extends Error {
  constructor(message = "Vous n'avez pas les droits nécessaires pour effectuer cette action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertCan(role: Role, permission: Permission) {
  if (!can(role, permission)) throw new ForbiddenError();
}
