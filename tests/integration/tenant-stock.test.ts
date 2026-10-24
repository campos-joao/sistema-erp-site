/**
 * Testes de integração contra um PostgreSQL real com as migrações aplicadas.
 * Rodam apenas com TEST_DATABASE_URL definido (ex.: banco do `npx prisma dev`).
 * Cada execução cria tenants próprios e os remove ao final (cascade).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("multi-tenant + estoque (integração)", async () => {
  if (!url) return;
  process.env.DATABASE_URL = url;

  const { prisma } = await import("@/lib/db");
  const { forTenant } = await import("@/lib/tenant-db");
  const { applyStockMovement } = await import("@/features/stock/service");
  const { StockError } = await import("@/features/stock/movement");

  const suffix = Date.now().toString(36);
  let tenantA: string;
  let tenantB: string;
  let locationA: string;
  let simpleProduct: string;
  let variedProduct: string;
  let variationA: string;
  let variationB: string;

  const author = () => ({ id: "test-user", name: "Teste", tenantId: tenantA });
  const move = (data: {
    type: "IN" | "OUT" | "ADJUSTMENT";
    quantity: string;
    productId?: string;
    variationId?: string | null;
  }) =>
    applyStockMovement(
      forTenant(tenantA),
      {
        productId: simpleProduct,
        variationId: null,
        locationId: locationA,
        note: null,
        ...data,
      },
      author(),
    );

  beforeAll(async () => {
    const [a, b] = await Promise.all([
      prisma.tenant.create({ data: { name: `A ${suffix}` } }),
      prisma.tenant.create({ data: { name: `B ${suffix}` } }),
    ]);
    tenantA = a.id;
    tenantB = b.id;

    const dbA = forTenant(tenantA);
    locationA = (await dbA.stockLocation.create({ data: { name: "Principal", tenantId: tenantA } })).id;
    simpleProduct = (
      await dbA.product.create({ data: { name: "Simples", sku: `S-${suffix}`, price: "10", tenantId: tenantA } })
    ).id;
    variedProduct = (
      await dbA.product.create({ data: { name: "Camiseta", sku: `C-${suffix}`, price: "50", tenantId: tenantA } })
    ).id;
    variationA = (
      await dbA.productVariation.create({
        data: { productId: variedProduct, sku: `C-${suffix}-P`, size: "P", tenantId: tenantA },
      })
    ).id;

    const dbB = forTenant(tenantB);
    const productB = await dbB.product.create({ data: { name: "B", sku: `B-${suffix}`, price: "1", tenantId: tenantB } });
    variationB = (
      await dbB.productVariation.create({
        data: { productId: productB.id, sku: `B-${suffix}-1`, color: "Azul", tenantId: tenantB },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB].filter(Boolean) } } });
    await prisma.$disconnect();
  });

  describe("isolamento entre tenants", () => {
    it("um tenant não enxerga produtos de outro", async () => {
      const dbB = forTenant(tenantB);
      expect(await dbB.product.findUnique({ where: { id: simpleProduct } })).toBeNull();
      expect(await dbB.product.count({ where: { id: simpleProduct } })).toBe(0);
    });

    it("um tenant não consegue alterar nem excluir dados de outro", async () => {
      const dbB = forTenant(tenantB);
      await expect(dbB.product.update({ where: { id: simpleProduct }, data: { name: "hack" } })).rejects.toThrow();
      expect((await dbB.product.deleteMany({ where: { id: simpleProduct } })).count).toBe(0);
    });

    it("um usuário pode ser membro de várias lojas, e cada loja só vê os próprios vínculos", async () => {
      const user = await prisma.user.create({
        data: { name: "Multi", email: `multi-${suffix}@test.local`, passwordHash: "x" },
      });
      try {
        await forTenant(tenantA).membership.create({ data: { userId: user.id, tenantId: tenantA, role: "ADMIN" } });
        await forTenant(tenantB).membership.create({ data: { userId: user.id, tenantId: tenantB, role: "MEMBER" } });

        const inA = await forTenant(tenantA).membership.findMany({ where: { userId: user.id } });
        expect(inA.map((m) => [m.tenantId, m.role])).toEqual([[tenantA, "ADMIN"]]);

        // Remover o acesso na loja B não afeta a loja A.
        expect((await forTenant(tenantB).membership.deleteMany({ where: { userId: user.id } })).count).toBe(1);
        expect(await prisma.membership.count({ where: { userId: user.id } })).toBe(1);
      } finally {
        await prisma.user.delete({ where: { id: user.id } });
      }
    });

    it("tenantId informado pelo chamador é sobrescrito", async () => {
      const dbB = forTenant(tenantB);
      const created = await dbB.stockLocation.create({ data: { name: `Forjado ${suffix}`, tenantId: tenantA } });
      const raw = await prisma.stockLocation.findUniqueOrThrow({ where: { id: created.id } });
      expect(raw.tenantId).toBe(tenantB);
    });

    it("o banco impede saldo apontando para variação de outro tenant (FK composta)", async () => {
      await expect(
        prisma.stockItem.create({
          data: {
            tenantId: tenantA,
            productId: variedProduct,
            variationId: variationB,
            locationId: locationA,
            quantity: 1,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("movimentações", () => {
    it("entrada, saída e ajuste atualizam o saldo e geram histórico", async () => {
      expect((await move({ type: "IN", quantity: "10" })).balanceAfter.toString()).toBe("10");
      expect((await move({ type: "OUT", quantity: "3" })).balanceAfter.toString()).toBe("7");
      expect((await move({ type: "ADJUSTMENT", quantity: "5" })).balanceAfter.toString()).toBe("5");

      const movements = await forTenant(tenantA).stockMovement.findMany({
        where: { productId: simpleProduct },
        orderBy: { createdAt: "asc" },
      });
      expect(movements.map((m) => [m.type, m.quantity.toString()])).toEqual([
        ["IN", "10"],
        ["OUT", "-3"],
        ["ADJUSTMENT", "-2"],
      ]);
    });

    it("saída acima do saldo é bloqueada", async () => {
      await expect(move({ type: "OUT", quantity: "999" })).rejects.toBeInstanceOf(StockError);
    });

    it("produto com variações exige a variação", async () => {
      await expect(move({ type: "IN", quantity: "1", productId: variedProduct })).rejects.toThrow("Selecione a variação");
      const result = await move({ type: "IN", quantity: "4", productId: variedProduct, variationId: variationA });
      expect(result.balanceAfter.toString()).toBe("4");
    });

    it("não aceita variação de outro tenant", async () => {
      await expect(
        move({ type: "IN", quantity: "1", productId: variedProduct, variationId: variationB }),
      ).rejects.toBeInstanceOf(StockError);
    });

    it("existe um único saldo por produto sem variação em cada depósito (índice parcial)", async () => {
      await expect(
        prisma.stockItem.create({
          data: { tenantId: tenantA, productId: simpleProduct, variationId: null, locationId: locationA, quantity: 1 },
        }),
      ).rejects.toThrow();
      expect(await prisma.stockItem.count({ where: { productId: simpleProduct, variationId: null } })).toBe(1);
    });

    it("saídas simultâneas nunca deixam o saldo negativo", async () => {
      await move({ type: "ADJUSTMENT", quantity: "3" });
      const results = await Promise.allSettled(Array.from({ length: 6 }, () => move({ type: "OUT", quantity: "1" })));

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const item = await prisma.stockItem.findFirstOrThrow({ where: { productId: simpleProduct, variationId: null } });
      expect(Number(item.quantity)).toBeGreaterThanOrEqual(0);
      expect(Number(item.quantity)).toBe(3 - ok);
      results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .forEach((r) => expect(r.reason).toBeInstanceOf(StockError));
    });
  });
});
