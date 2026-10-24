"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fail, invalid, type ActionResult } from "@/lib/action-result";
import { requireUser, setActiveTenant } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { companySchema, type CompanyInput } from "@/features/settings/schemas";

/** Troca a loja ativa. Só aceita lojas das quais o usuário é membro. */
export async function switchTenant(tenantId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.tenants.some((t) => t.id === tenantId)) return fail("Você não tem acesso a esta loja");

  await setActiveTenant(tenantId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Cria uma nova loja (empresa separada); o criador vira administrador e entra nela. */
export async function createTenant(input: CompanyInput): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const tenant = await prisma.$transaction(async (tx) => {
    const created = await tx.tenant.create({ data: parsed.data, select: { id: true } });
    await tx.membership.create({ data: { tenantId: created.id, userId: user.userId, role: "ADMIN" } });
    await tx.stockLocation.create({ data: { tenantId: created.id, name: "Depósito principal" } });
    return created;
  });

  await setActiveTenant(tenant.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
