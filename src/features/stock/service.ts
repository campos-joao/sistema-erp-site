import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { isUniqueViolation } from "@/lib/prisma-errors";
import type { TenantDb } from "@/lib/tenant-db";
import { computeMovement, StockError } from "@/features/stock/movement";
import type { MovementData } from "@/features/stock/schemas";

class ConcurrentUpdate extends Error {}

const MAX_ATTEMPTS = 3;

/**
 * Registra uma movimentação e atualiza o saldo de forma atômica.
 *
 * Concorrência: o saldo é atualizado com controle otimista (`WHERE quantity = saldo lido`);
 * se outra operação alterar o saldo no meio do caminho, a transação inteira é refeita.
 * Isso garante que duas saídas simultâneas nunca deixem o saldo negativo.
 */
export async function applyStockMovement(
  db: TenantDb,
  data: MovementData,
  author: { id: string; name: string; tenantId: string },
) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const [product, location] = await Promise.all([
          tx.product.findUnique({
            where: { id: data.productId },
            select: { id: true, variations: { select: { id: true } } },
          }),
          tx.stockLocation.findUnique({ where: { id: data.locationId }, select: { id: true } }),
        ]);
        if (!product) throw new StockError("Produto não encontrado");
        if (!location) throw new StockError("Depósito não encontrado");

        const hasVariations = product.variations.length > 0;
        if (hasVariations && !data.variationId) throw new StockError("Selecione a variação do produto");
        if (!hasVariations && data.variationId) throw new StockError("Este produto não possui variações");
        if (data.variationId && !product.variations.some((v) => v.id === data.variationId)) {
          throw new StockError("Variação não pertence ao produto");
        }

        const key = { locationId: data.locationId, productId: data.productId, variationId: data.variationId };
        const item = await tx.stockItem.findFirst({ where: key, select: { id: true, quantity: true } });
        const current = item?.quantity ?? new Prisma.Decimal(0);

        const { delta, balance } = computeMovement(data.type, current, new Prisma.Decimal(data.quantity));

        if (item) {
          const { count } = await tx.stockItem.updateMany({
            where: { id: item.id, quantity: current },
            data: { quantity: balance },
          });
          if (count === 0) throw new ConcurrentUpdate();
        } else {
          await tx.stockItem.create({ data: { ...key, tenantId: author.tenantId, quantity: balance } });
        }

        return tx.stockMovement.create({
          data: {
            ...key,
            tenantId: author.tenantId,
            type: data.type,
            quantity: delta,
            balanceAfter: balance,
            note: data.note,
            createdById: author.id,
            createdByName: author.name,
          },
          select: { id: true, balanceAfter: true },
        });
      });
    } catch (error) {
      // Conflito com operação simultânea (saldo alterado ou saldo criado por outra transação).
      const conflict = error instanceof ConcurrentUpdate || isUniqueViolation(error);
      if (!conflict) throw error;
      if (attempt >= MAX_ATTEMPTS) {
        throw new StockError("O saldo foi alterado por outra operação. Tente novamente.");
      }
    }
  }
}
