import "server-only";

import { notFound } from "next/navigation";

import type { Prisma } from "@/generated/prisma/client";
import { getTenantDb } from "@/lib/dal";
import { pageParams, param, type SearchParams } from "@/lib/pagination";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: string;
  cost: string | null;
  variationCount: number;
  stock: string;
  createdAt: string;
};

export async function listProducts(searchParams: SearchParams) {
  const db = await getTenantDb();
  const { page, skip, take } = pageParams(searchParams);
  const q = param(searchParams, "q");
  const type = param(searchParams, "tipo");
  const stock = param(searchParams, "estoque");

  const contains = { contains: q, mode: "insensitive" } as const;
  const where: Prisma.ProductWhereInput = {
    ...(q && {
      OR: [
        { name: contains },
        { sku: contains },
        { barcode: contains },
        { variations: { some: { OR: [{ sku: contains }, { barcode: contains }] } } },
      ],
    }),
    ...(type === "simples" && { variations: { none: {} } }),
    ...(type === "variacoes" && { variations: { some: {} } }),
    ...(stock === "com" && { stockItems: { some: { quantity: { gt: 0 } } } }),
    ...(stock === "sem" && { stockItems: { none: { quantity: { gt: 0 } } } }),
  };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        price: true,
        cost: true,
        createdAt: true,
        _count: { select: { variations: true } },
      },
    }),
  ]);

  const sums = await db.stockItem.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((p) => p.id) } },
    _sum: { quantity: true },
  });
  const stockByProduct = new Map(sums.map((s) => [s.productId, s._sum.quantity?.toString() ?? "0"]));

  const rows: ProductRow[] = products.map(({ _count, ...product }) => ({
    ...product,
    price: product.price.toString(),
    cost: product.cost?.toString() ?? null,
    variationCount: _count.variations,
    stock: stockByProduct.get(product.id) ?? "0",
    createdAt: product.createdAt.toISOString(),
  }));

  return { rows, total, page };
}

export async function getProduct(id: string) {
  const db = await getTenantDb();
  const product = await db.product.findUnique({
    where: { id },
    include: {
      variations: { orderBy: [{ color: "asc" }, { size: "asc" }, { sku: "asc" }] },
      stockItems: {
        include: { location: { select: { name: true } } },
        orderBy: { location: { name: "asc" } },
      },
    },
  });
  if (!product) notFound();

  const stockByVariation = new Map<string, number>();
  product.stockItems.forEach((item) => {
    if (item.variationId) {
      stockByVariation.set(item.variationId, (stockByVariation.get(item.variationId) ?? 0) + Number(item.quantity));
    }
  });

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    price: product.price.toString(),
    cost: product.cost?.toString() ?? null,
    variations: product.variations.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      color: v.color,
      size: v.size,
      price: v.price?.toString() ?? null,
      cost: v.cost?.toString() ?? null,
      stock: String(stockByVariation.get(v.id) ?? 0),
    })),
    stock: product.stockItems.map((item) => ({
      id: item.id,
      locationName: item.location.name,
      variationId: item.variationId,
      quantity: item.quantity.toString(),
    })),
  };
}

export type ProductDetail = Awaited<ReturnType<typeof getProduct>>;
export type VariationRow = ProductDetail["variations"][number];

/** Opções para selects de movimentação de estoque. */
export async function listProductOptions() {
  const db = await getTenantDb();
  const products = await db.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      variations: { orderBy: [{ color: "asc" }, { size: "asc" }], select: { id: true, sku: true, color: true, size: true } },
    },
  });
  return products;
}

export type ProductOption = Awaited<ReturnType<typeof listProductOptions>>[number];
