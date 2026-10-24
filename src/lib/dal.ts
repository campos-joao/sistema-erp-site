import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { fail, type ActionError } from "@/lib/action-result";
import { prisma } from "@/lib/db";
import { can, type Permission } from "@/lib/permissions";
import { forTenant, type TenantDb } from "@/lib/tenant-db";

/** Cookie com a loja (tenant) ativa. É só uma preferência: o acesso é sempre validado. */
export const ACTIVE_TENANT_COOKIE = "erp_tenant";

/**
 * Usuário logado com as lojas às quais tem acesso. Nome, e-mail e vínculos vêm
 * do banco (não do JWT), então mudanças e remoções valem imediatamente.
 */
export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      memberships: {
        orderBy: { tenant: { name: "asc" } },
        select: { tenantId: true, role: true, tenant: { select: { name: true } } },
      },
    },
  });
  // Usuário removido com JWT ainda válido: encerra a sessão.
  if (!user) redirect("/sair");

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    tenants: user.memberships.map((m) => ({ id: m.tenantId, name: m.tenant.name, role: m.role })),
  };
});

export type CurrentUser = Awaited<ReturnType<typeof requireUser>>;

/**
 * Data Access Layer: único ponto de onde sai o `tenantId`.
 * A loja ativa vem do cookie, mas só é aceita se o usuário for membro dela;
 * caso contrário, usa a primeira loja do usuário. Sem nenhuma loja, vai para
 * a criação de loja.
 */
export const requireSession = cache(async () => {
  const [user, cookieStore] = await Promise.all([requireUser(), cookies()]);
  const preferred = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  const active = user.tenants.find((t) => t.id === preferred) ?? user.tenants[0];
  if (!active) redirect("/lojas/nova");

  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    tenantId: active.id,
    tenantName: active.name,
    role: active.role,
  };
});

export type CurrentSession = Awaited<ReturnType<typeof requireSession>>;

export const getTenantDb = cache(async () => {
  const { tenantId } = await requireSession();
  return forTenant(tenantId);
});

export const getCurrentTenant = cache(async () => {
  const { tenantId } = await requireSession();
  return prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { id: true, name: true, document: true },
  });
});

/** Para Server Actions: garante sessão + permissão na loja ativa e devolve o client do tenant. */
export async function authorize(
  permission: Permission,
): Promise<{ ok: true; session: CurrentSession; db: TenantDb } | ActionError> {
  const session = await requireSession();
  if (!can(session.role, permission)) return fail("Você não tem permissão para realizar esta ação");
  return { ok: true, session, db: await getTenantDb() };
}

/** Define a loja ativa (usar só em Server Actions/Route Handlers). */
export async function setActiveTenant(tenantId: string) {
  (await cookies()).set(ACTIVE_TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
