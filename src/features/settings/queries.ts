import "server-only";

import { getTenantDb } from "@/lib/dal";

/** Membros da loja ativa. */
export async function listUsers() {
  const db = await getTenantDb();
  const memberships = await db.membership.findMany({
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    select: { role: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
  });
  return memberships.map((m) => ({ ...m.user, role: m.role, createdAt: m.createdAt.toISOString() }));
}

export type UserRow = Awaited<ReturnType<typeof listUsers>>[number];
