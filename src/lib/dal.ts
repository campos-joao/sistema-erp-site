import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { forTenant } from "@/lib/tenant-db";

/**
 * Data Access Layer: único ponto de onde sai o `tenantId`.
 * O tenant SEMPRE vem da sessão do servidor, nunca do cliente.
 */
export const requireSession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) redirect("/login");

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
});

export const getTenantDb = cache(async () => {
  const { tenantId } = await requireSession();
  return forTenant(tenantId);
});

export const getCurrentTenant = cache(async () => {
  const { tenantId } = await requireSession();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, document: true },
  });
  if (!tenant) redirect("/login");
  return tenant;
});
