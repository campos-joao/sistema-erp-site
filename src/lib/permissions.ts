import type { Role } from "@/generated/prisma/enums";

export type Permission =
  | "product:write"
  | "product:delete"
  | "stock:move"
  | "location:manage"
  | "company:manage"
  | "users:manage";

/**
 * ADMIN: acesso total. MEMBER: opera o dia a dia (cadastra/edita produtos e
 * movimenta estoque), mas não exclui produtos nem gerencia depósitos,
 * empresa ou usuários.
 */
const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    "product:write",
    "product:delete",
    "stock:move",
    "location:manage",
    "company:manage",
    "users:manage",
  ]),
  MEMBER: new Set<Permission>(["product:write", "stock:move"]),
};

export const can = (role: Role, permission: Permission) => ROLE_PERMISSIONS[role].has(permission);

export const ROLE_LABELS: Record<Role, string> = { ADMIN: "Administrador", MEMBER: "Membro" };
