import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { computeMovement, StockError } from "@/features/stock/movement";

const d = (value: string | number) => new Prisma.Decimal(value);

describe("computeMovement", () => {
  it("entrada soma ao saldo", () => {
    const { delta, balance } = computeMovement("IN", d(5), d("2.5"));
    expect(delta.toString()).toBe("2.5");
    expect(balance.toString()).toBe("7.5");
  });

  it("saída subtrai do saldo", () => {
    const { delta, balance } = computeMovement("OUT", d(5), d(5));
    expect(delta.toString()).toBe("-5");
    expect(balance.toString()).toBe("0");
  });

  it("saída maior que o saldo é bloqueada", () => {
    expect(() => computeMovement("OUT", d(2), d(3))).toThrow(StockError);
  });

  it("ajuste define o saldo contado e registra a diferença", () => {
    const up = computeMovement("ADJUSTMENT", d(10), d(12));
    expect(up.delta.toString()).toBe("2");
    expect(up.balance.toString()).toBe("12");

    const down = computeMovement("ADJUSTMENT", d(10), d(0));
    expect(down.delta.toString()).toBe("-10");
    expect(down.balance.toString()).toBe("0");
  });

  it("ajuste sem diferença é rejeitado", () => {
    expect(() => computeMovement("ADJUSTMENT", d(4), d(4))).toThrow("igual ao saldo atual");
  });

  it("quantidade zero em entrada/saída e negativa em qualquer tipo é rejeitada", () => {
    expect(() => computeMovement("IN", d(0), d(0))).toThrow(StockError);
    expect(() => computeMovement("OUT", d(5), d(0))).toThrow(StockError);
    expect(() => computeMovement("ADJUSTMENT", d(5), d(-1))).toThrow(StockError);
  });
});
