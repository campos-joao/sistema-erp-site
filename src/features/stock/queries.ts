import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { StockMovementType } from "@/generated/prisma/enums";
import { getTenantDb } from "@/lib/dal";
import { pageParams, param, type SearchParams } from "@/lib/pagination";

const MOVEMENT_TYPES: StockMovementType[] = ["IN", "OUT", "ADJUSTMENT"];

const productSearch = (q: string): Prisma.StockItemWhereInput | undefined => {
  if (!q) return undefined;
  const contains = { contains: q, mode: "insensitive" } as const;
  return {
    OR: [
      { product: { OR: [{ name: contains }, { sku: contains }, { barcode: contains }] } },
      { variation: { OR: [{ sku: contains }, { barcode: contains }, { color: contains }, { size: contains }] } },
    ],
  };
};

export async function listBalances(searchParams: SearchParams) {
  const db = await getTenantDb();
  const { page, skip, take } = pageParams(searchParams);
  const q = param(searchParams, "q");
  const locationId = param(searchParams, "deposito");
  const balance = param(searchParams, "saldo");

  const where: Prisma.StockItemWhereInput = {
    ...productSearch(q),
    ...(locationId && { locationId }),
    ...(balance === "positivo" && { quantity: { gt: 0 } }),
    ...(balance === "zerado" && { quantity: 0 }),
    ...(balance === "negativo" && { quantity: { lt: 0 } }),
  };

  const [total, items] = await Promise.all([
    db.stockItem.count({ where }),
    db.stockItem.findMany({
      where,
      orderBy: [{ product: { name: "asc" } }, { variation: { sku: "asc" } }, { location: { name: "asc" } }],
      skip,
      take,
      select: {
        id: true,
        quantity: true,
        updatedAt: true,
        product: { select: { id: true, name: true, sku: true, cost: true } },
        variation: { select: { id: true, sku: true, color: true, size: true, cost: true } },
        location: { select: { id: true, name: true } },
      },
    }),
  ]);

  const rows = items.map((item) => ({
    id: item.id,
    quantity: item.quantity.toString(),
    updatedAt: item.updatedAt.toISOString(),
    productId: item.product.id,
    productName: item.product.name,
    sku: item.variation?.sku ?? item.product.sku,
    variation: item.variation ? { id: item.variation.id, color: item.variation.color, size: item.variation.size } : null,
    location: item.location,
    unitCost: (item.variation?.cost ?? item.product.cost)?.toString() ?? null,
  }));

  return { rows, total, page };
}

export type BalanceRow = Awaited<ReturnType<typeof listBalances>>["rows"][number];

export async function listMovements(searchParams: SearchParams, take?: number) {
  const db = await getTenantDb();
  const pagination = pageParams(searchParams);
  const q = param(searchParams, "q");
  const locationId = param(searchParams, "deposito");
  const type = param(searchParams, "tipo") as StockMovementType;
  const productId = param(searchParams, "produto");

  const where: Prisma.StockMovementWhereInput = {
    ...(productSearch(q) as Prisma.StockMovementWhereInput | undefined),
    ...(locationId && { locationId }),
    ...(productId && { productId }),
    ...(MOVEMENT_TYPES.includes(type) && { type }),
  };

  const [total, movements] = await Promise.all([
    db.stockMovement.count({ where }),
    db.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: take ? 0 : pagination.skip,
      take: take ?? pagination.take,
      select: {
        id: true,
        type: true,
        quantity: true,
        balanceAfter: true,
        note: true,
        createdByName: true,
        createdAt: true,
        product: { select: { id: true, name: true, sku: true } },
        variation: { select: { sku: true, color: true, size: true } },
        location: { select: { name: true } },
      },
    }),
  ]);

  const rows = movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity.toString(),
    balanceAfter: m.balanceAfter.toString(),
    note: m.note,
    createdByName: m.createdByName,
    createdAt: m.createdAt.toISOString(),
    productId: m.product.id,
    productName: m.product.name,
    sku: m.variation?.sku ?? m.product.sku,
    variation: m.variation ? { color: m.variation.color, size: m.variation.size } : null,
    locationName: m.location.name,
  }));

  return { rows, total, page: pagination.page };
}

export type MovementRow = Awaited<ReturnType<typeof listMovements>>["rows"][number];

export async function listLocations() {
  const db = await getTenantDb();
  const [locations, sums] = await Promise.all([
    db.stockLocation.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, createdAt: true, _count: { select: { stockItems: { where: { quantity: { not: 0 } } } } } },
    }),
    db.stockItem.groupBy({ by: ["locationId"], _sum: { quantity: true } }),
  ]);
  const totals = new Map(sums.map((s) => [s.locationId, s._sum.quantity?.toString() ?? "0"]));

  return locations.map((location) => ({
    id: location.id,
    name: location.name,
    createdAt: location.createdAt.toISOString(),
    itemsWithStock: location._count.stockItems,
    totalQuantity: totals.get(location.id) ?? "0",
  }));
}

export type LocationRow = Awaited<ReturnType<typeof listLocations>>[number];

export async function listLocationOptions() {
  const db = await getTenantDb();
  return db.stockLocation.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export type LocationOption = Awaited<ReturnType<typeof listLocationOptions>>[number];
