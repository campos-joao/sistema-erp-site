import { Prisma } from "@/generated/prisma/client";
import type { StockMovementType } from "@/generated/prisma/enums";

export class StockError extends Error {}

/**
 * Regra de negócio pura de uma movimentação.
 * - IN: soma `quantity` ao saldo.
 * - OUT: subtrai `quantity`; não permite saldo negativo.
 * - ADJUSTMENT: `quantity` é o saldo contado; o delta é a diferença.
 */
export function computeMovement(type: StockMovementType, current: Prisma.Decimal, quantity: Prisma.Decimal) {
  if (quantity.isNegative()) throw new StockError("A quantidade não pode ser negativa");
  if (type !== "ADJUSTMENT" && quantity.isZero()) throw new StockError("A quantidade deve ser maior que zero");

  const delta =
    type === "IN" ? quantity : type === "OUT" ? quantity.negated() : quantity.minus(current);
  const balance = current.plus(delta);

  if (type === "OUT" && balance.isNegative()) {
    throw new StockError(`Saldo insuficiente. Disponível: ${current.toString()}`);
  }
  if (type === "ADJUSTMENT" && delta.isZero()) {
    throw new StockError("O saldo informado é igual ao saldo atual");
  }

  return { delta, balance };
}
