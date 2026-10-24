"use server";

import { revalidatePath } from "next/cache";

import { fail, invalid, type ActionResult } from "@/lib/action-result";
import { authorize } from "@/lib/dal";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { StockError } from "@/features/stock/movement";
import { locationSchema, movementSchema, type LocationInput, type MovementInput } from "@/features/stock/schemas";
import { applyStockMovement } from "@/features/stock/service";

const nameTaken = () => fail("Depósito já existe", { name: ["Já existe um depósito com este nome"] });

function revalidateStock(productId?: string) {
  revalidatePath("/estoque", "layout");
  revalidatePath("/produtos");
  revalidatePath("/dashboard");
  if (productId) revalidatePath(`/produtos/${productId}`);
}

export async function createMovement(input: MovementInput): Promise<ActionResult<{ balanceAfter: string }>> {
  const auth = await authorize("stock:move");
  if (!auth.ok) return auth;

  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const movement = await applyStockMovement(auth.db, parsed.data, {
      id: auth.session.userId,
      name: auth.session.name,
      tenantId: auth.session.tenantId,
    });
    revalidateStock(parsed.data.productId);
    return { ok: true, data: { balanceAfter: movement.balanceAfter.toString() } };
  } catch (error) {
    if (error instanceof StockError) return fail(error.message);
    throw error;
  }
}

export async function createLocation(input: LocationInput): Promise<ActionResult> {
  const auth = await authorize("location:manage");
  if (!auth.ok) return auth;

  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    await auth.db.stockLocation.create({ data: { ...parsed.data, tenantId: auth.session.tenantId } });
  } catch (error) {
    if (isUniqueViolation(error)) return nameTaken();
    throw error;
  }

  revalidateStock();
  return { ok: true };
}

export async function updateLocation(id: string, input: LocationInput): Promise<ActionResult> {
  const auth = await authorize("location:manage");
  if (!auth.ok) return auth;

  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    await auth.db.stockLocation.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error)) return nameTaken();
    if (isNotFound(error)) return fail("Depósito não encontrado");
    throw error;
  }

  revalidateStock();
  return { ok: true };
}

export async function deleteLocation(id: string): Promise<ActionResult> {
  const auth = await authorize("location:manage");
  if (!auth.ok) return auth;

  const [count, withStock] = await Promise.all([
    auth.db.stockLocation.count(),
    auth.db.stockItem.findFirst({ where: { locationId: id, quantity: { not: 0 } }, select: { id: true } }),
  ]);
  if (count <= 1) return fail("A empresa precisa ter pelo menos um depósito");
  if (withStock) return fail("Não é possível excluir um depósito com saldo. Transfira ou zere os saldos antes.");

  try {
    await auth.db.stockLocation.delete({ where: { id } });
  } catch (error) {
    if (isNotFound(error)) return fail("Depósito não encontrado");
    throw error;
  }

  revalidateStock();
  return { ok: true };
}
