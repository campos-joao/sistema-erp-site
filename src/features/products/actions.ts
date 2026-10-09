"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { type ActionResult } from "@/lib/action-result";
import { getTenantDb, requireSession } from "@/lib/dal";
import { createProductSchema, type CreateProductInput } from "@/features/products/schemas";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: string;
  createdAt: string;
};

export async function listProducts(): Promise<ProductRow[]> {
  const db = await getTenantDb();

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, sku: true, barcode: true, price: true, createdAt: true },
  });

  return products.map((product) => ({
    ...product,
    price: product.price.toString(),
    createdAt: product.createdAt.toISOString(),
  }));
}

export async function createProduct(input: CreateProductInput): Promise<ActionResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const [{ tenantId }, db] = await Promise.all([requireSession(), getTenantDb()]);

  try {
    await db.product.create({ data: { ...parsed.data, tenantId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "SKU já cadastrado", fieldErrors: { sku: ["Já existe um produto com este SKU"] } };
    }
    throw error;
  }

  revalidatePath("/produtos");
  return { ok: true };
}
