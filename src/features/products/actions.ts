"use server";

import { revalidatePath } from "next/cache";

import { fail, invalid, type ActionResult } from "@/lib/action-result";
import { authorize } from "@/lib/dal";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import type { TenantDb } from "@/lib/tenant-db";
import {
  productSchema,
  variationSchema,
  type ProductInput,
  type VariationInput,
} from "@/features/products/schemas";

const skuTaken = () => fail("SKU já cadastrado", { sku: ["Já existe um produto ou variação com este SKU"] });
const notFoundError = () => fail("Registro não encontrado");

/** SKU precisa ser único entre produtos e variações do tenant. */
async function skuInUse(db: TenantDb, sku: string, exclude: { productId?: string; variationId?: string } = {}) {
  const [product, variation] = await Promise.all([
    db.product.findFirst({ where: { sku, id: { not: exclude.productId } }, select: { id: true } }),
    db.productVariation.findFirst({ where: { sku, id: { not: exclude.variationId } }, select: { id: true } }),
  ]);
  return Boolean(product || variation);
}

const hasStock = (db: TenantDb, where: { productId?: string; variationId?: string | null }) =>
  db.stockItem.findFirst({ where: { ...where, quantity: { not: 0 } }, select: { id: true } }).then(Boolean);

function revalidateProduct(productId?: string) {
  revalidatePath("/produtos");
  if (productId) revalidatePath(`/produtos/${productId}`);
}

export async function createProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const auth = await authorize("product:write");
  if (!auth.ok) return auth;

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  if (await skuInUse(auth.db, parsed.data.sku)) return skuTaken();

  try {
    const product = await auth.db.product.create({
      data: { ...parsed.data, tenantId: auth.session.tenantId },
      select: { id: true },
    });
    revalidateProduct();
    return { ok: true, data: product };
  } catch (error) {
    if (isUniqueViolation(error)) return skuTaken();
    throw error;
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const auth = await authorize("product:write");
  if (!auth.ok) return auth;

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  if (await skuInUse(auth.db, parsed.data.sku, { productId: id })) return skuTaken();

  try {
    await auth.db.product.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error)) return skuTaken();
    if (isNotFound(error)) return notFoundError();
    throw error;
  }

  revalidateProduct(id);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const auth = await authorize("product:delete");
  if (!auth.ok) return auth;

  if (await hasStock(auth.db, { productId: id })) {
    return fail("Não é possível excluir um produto com saldo em estoque. Zere o saldo antes.");
  }

  try {
    await auth.db.product.delete({ where: { id } });
  } catch (error) {
    if (isNotFound(error)) return notFoundError();
    throw error;
  }

  revalidateProduct();
  revalidatePath("/estoque", "layout");
  return { ok: true };
}

export async function createVariation(productId: string, input: VariationInput): Promise<ActionResult> {
  const auth = await authorize("product:write");
  if (!auth.ok) return auth;

  const parsed = variationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const product = await auth.db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return notFoundError();

  // Produto com variações controla estoque por variação; saldo "solto" no produto ficaria órfão.
  if (await hasStock(auth.db, { productId, variationId: null })) {
    return fail("Este produto tem saldo em estoque sem variação. Zere o saldo antes de criar variações.");
  }

  if (await skuInUse(auth.db, parsed.data.sku)) return skuTaken();

  try {
    await auth.db.productVariation.create({
      data: { ...parsed.data, productId, tenantId: auth.session.tenantId },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return skuTaken();
    throw error;
  }

  revalidateProduct(productId);
  return { ok: true };
}

export async function updateVariation(id: string, input: VariationInput): Promise<ActionResult> {
  const auth = await authorize("product:write");
  if (!auth.ok) return auth;

  const parsed = variationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  if (await skuInUse(auth.db, parsed.data.sku, { variationId: id })) return skuTaken();

  try {
    const variation = await auth.db.productVariation.update({
      where: { id },
      data: parsed.data,
      select: { productId: true },
    });
    revalidateProduct(variation.productId);
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) return skuTaken();
    if (isNotFound(error)) return notFoundError();
    throw error;
  }
}

export async function deleteVariation(id: string): Promise<ActionResult> {
  const auth = await authorize("product:delete");
  if (!auth.ok) return auth;

  if (await hasStock(auth.db, { variationId: id })) {
    return fail("Não é possível excluir uma variação com saldo em estoque. Zere o saldo antes.");
  }

  try {
    const variation = await auth.db.productVariation.delete({ where: { id }, select: { productId: true } });
    revalidateProduct(variation.productId);
    revalidatePath("/estoque", "layout");
    return { ok: true };
  } catch (error) {
    if (isNotFound(error)) return notFoundError();
    throw error;
  }
}
