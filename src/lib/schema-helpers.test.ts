import { describe, expect, it } from "vitest";

import { money, normalizeDecimal, optionalMoney, quantity } from "@/lib/schema-helpers";

describe("normalizeDecimal", () => {
  it.each([
    ["19,90", "19.90"],
    ["1.234,56", "1234.56"],
    ["R$ 10", "10"],
    ["19.90", "19.90"],
  ])("%s => %s", (input, expected) => {
    expect(normalizeDecimal(input)).toBe(expected);
  });
});

describe("money", () => {
  const schema = money("obrigatório");

  it("normaliza valores válidos", () => {
    expect(schema.parse("1.234,5")).toBe("1234.5");
  });

  it("rejeita vazio, negativo e mais de 2 casas", () => {
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse("-1").success).toBe(false);
    expect(schema.safeParse("1,999").success).toBe(false);
  });
});

describe("optionalMoney", () => {
  it("transforma vazio em null", () => {
    expect(optionalMoney().parse("  ")).toBeNull();
    expect(optionalMoney().parse("5,00")).toBe("5.00");
  });
});

describe("quantity", () => {
  it("aceita até 3 casas decimais", () => {
    expect(quantity("obrigatório").parse("2,525")).toBe("2.525");
    expect(quantity("obrigatório").safeParse("2,5255").success).toBe(false);
  });
});
