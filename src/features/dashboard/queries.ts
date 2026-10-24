import "server-only";

import { getTenantDb } from "@/lib/dal";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboardStats() {
  const db = await getTenantDb();
  const since = new Date(Date.now() - 30 * DAY_MS);
  const withoutStock = { stockItems: { none: { quantity: { gt: 0 } } } };

  const [productCount, locationCount, items, movementsByType, outOfStockCount, outOfStock] = await Promise.all([
    db.product.count(),
    db.stockLocation.count(),
    db.stockItem.findMany({
      where: { quantity: { gt: 0 } },
      select: { quantity: true, product: { select: { cost: true } }, variation: { select: { cost: true } } },
    }),
    db.stockMovement.groupBy({ by: ["type"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.product.count({ where: withoutStock }),
    db.product.findMany({
      where: withoutStock,
      orderBy: { name: "asc" },
      take: 5,
      select: { id: true, name: true, sku: true },
    }),
  ]);

  let units = 0;
  let stockValue = 0;
  let itemsWithoutCost = 0;
  for (const item of items) {
    const quantity = Number(item.quantity);
    const cost = item.variation?.cost ?? item.product.cost;
    units += quantity;
    if (cost) stockValue += quantity * Number(cost);
    else itemsWithoutCost++;
  }

  const movements = Object.fromEntries(movementsByType.map((m) => [m.type, m._count._all])) as Partial<
    Record<"IN" | "OUT" | "ADJUSTMENT", number>
  >;

  return {
    productCount,
    locationCount,
    units,
    stockValue,
    itemsWithoutCost,
    outOfStockCount,
    outOfStock,
    movements: {
      total: (movements.IN ?? 0) + (movements.OUT ?? 0) + (movements.ADJUSTMENT ?? 0),
      in: movements.IN ?? 0,
      out: movements.OUT ?? 0,
      adjustment: movements.ADJUSTMENT ?? 0,
    },
  };
}
