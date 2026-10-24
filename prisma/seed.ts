/**
 * Dados de exemplo para desenvolvimento: `npm run db:seed`.
 * Cria a empresa "Loja Demo" com usuários, depósitos, produtos (com e sem
 * variações) e movimentações. Se os dados demo já existirem, não os recria.
 * O administrador de testes (admin@admin.com) é sempre garantido com a senha
 * abaixo e perfil ADMIN na "Loja Demo" e no "Outlet Demo".
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient, type StockMovementType } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const ADMIN_EMAIL = "admin@demo.com";
const MEMBER_EMAIL = "membro@demo.com";
const PASSWORD = "demo1234";

// Usuário de testes com acesso total. Apenas para desenvolvimento: não rode o seed em produção.
const TEST_ADMIN = { name: "Administrador", email: "admin@admin.com", password: "admin123" };

type SeedProduct = {
  name: string;
  sku: string;
  price: string;
  cost?: string;
  barcode?: string;
  variations?: { sku: string; color?: string; size?: string }[];
};

const PRODUCTS: SeedProduct[] = [
  { name: "Caneca de cerâmica 300ml", sku: "CAN-300", price: "39.90", cost: "14.50", barcode: "7891000100103" },
  { name: "Caderno universitário 10 matérias", sku: "CAD-10M", price: "32.00", cost: "17.80" },
  { name: "Café torrado em grãos (kg)", sku: "CAFE-KG", price: "89.90", cost: "52.00" },
  { name: "Garrafa térmica 1L", sku: "GAR-1L", price: "119.00", cost: "61.00" },
  {
    name: "Camiseta básica algodão",
    sku: "CAM-BAS",
    price: "59.90",
    cost: "22.00",
    variations: [
      { sku: "CAM-BAS-PRE-P", color: "Preta", size: "P" },
      { sku: "CAM-BAS-PRE-M", color: "Preta", size: "M" },
      { sku: "CAM-BAS-PRE-G", color: "Preta", size: "G" },
      { sku: "CAM-BAS-BRA-M", color: "Branca", size: "M" },
      { sku: "CAM-BAS-BRA-G", color: "Branca", size: "G" },
    ],
  },
  {
    name: "Tênis de corrida",
    sku: "TEN-RUN",
    price: "349.90",
    cost: "180.00",
    variations: [
      { sku: "TEN-RUN-39", size: "39" },
      { sku: "TEN-RUN-40", size: "40" },
      { sku: "TEN-RUN-41", size: "41" },
      { sku: "TEN-RUN-42", size: "42" },
    ],
  },
  { name: "Mochila executiva", sku: "MOC-EXE", price: "229.00" },
];

const SECOND_STORE = "Outlet Demo";

async function main() {
  const existing = await prisma.membership.findFirst({
    where: { user: { email: ADMIN_EMAIL } },
    select: { tenantId: true },
  });
  if (existing) console.log("Dados demo já existem; não serão recriados.");
  const demoTenantId = existing?.tenantId ?? (await createDemoData());

  const testAdminId = await ensureTestAdmin();
  const outletId = await ensureSecondStore(testAdminId);
  await ensureAdminMembership(testAdminId, demoTenantId);
  await ensureAdminMembership(testAdminId, outletId);

  console.log("Seed concluído.");
  console.log(`  Admin de testes: ${TEST_ADMIN.email} / ${TEST_ADMIN.password} (Loja Demo e ${SECOND_STORE})`);
  console.log(`  Admin demo:      ${ADMIN_EMAIL} / ${PASSWORD}`);
  console.log(`  Membro demo:     ${MEMBER_EMAIL} / ${PASSWORD}`);
}

/** Cria (ou corrige a senha do) admin de testes. */
async function ensureTestAdmin() {
  const passwordHash = await bcrypt.hash(TEST_ADMIN.password, 12);
  const user = await prisma.user.upsert({
    where: { email: TEST_ADMIN.email },
    create: { name: TEST_ADMIN.name, email: TEST_ADMIN.email, passwordHash },
    update: { passwordHash },
    select: { id: true },
  });
  return user.id;
}

/** Garante o vínculo como ADMIN (cria ou promove). */
async function ensureAdminMembership(userId: string, tenantId: string) {
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId, tenantId } },
    create: { userId, tenantId, role: "ADMIN" },
    update: { role: "ADMIN" },
  });
}

/** Segunda loja do admin de testes, para experimentar a troca de lojas. */
async function ensureSecondStore(userId: string) {
  const found = await prisma.tenant.findFirst({
    where: { name: SECOND_STORE, memberships: { some: { userId } } },
    select: { id: true },
  });
  if (found) return found.id;

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name: SECOND_STORE } });
    const tenantId = tenant.id;
    const location = await tx.stockLocation.create({ data: { tenantId, name: "Depósito principal" } });
    const items = [
      { name: "Jaqueta corta-vento", sku: "OUT-JAQ", price: "149.90", cost: "70.00", quantity: 12 },
      { name: "Boné aba curva", sku: "OUT-BON", price: "49.90", cost: "18.00", quantity: 30 },
    ];
    for (const { quantity, ...data } of items) {
      const product = await tx.product.create({ data: { ...data, tenantId } });
      await tx.stockItem.create({ data: { tenantId, productId: product.id, locationId: location.id, quantity } });
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          locationId: location.id,
          type: "IN",
          quantity,
          balanceAfter: quantity,
          note: "Estoque inicial",
          createdById: userId,
          createdByName: TEST_ADMIN.name,
        },
      });
    }
    return tenantId;
  });
}

async function createDemoData() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  return prisma.$transaction(
    async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: "Loja Demo", document: "11222333000181" } });
      const tenantId = tenant.id;

      const [admin, member] = await Promise.all([
        tx.user.create({ data: { name: "Ana Admin", email: ADMIN_EMAIL, passwordHash } }),
        tx.user.create({ data: { name: "Marcos Membro", email: MEMBER_EMAIL, passwordHash } }),
      ]);
      await tx.membership.createMany({
        data: [
          { tenantId, userId: admin.id, role: "ADMIN" },
          { tenantId, userId: member.id, role: "MEMBER" },
        ],
      });

      const warehouse = await tx.stockLocation.create({ data: { tenantId, name: "Depósito principal" } });
      const store = await tx.stockLocation.create({ data: { tenantId, name: "Loja centro" } });

      // Saldo em memória para gerar movimentações coerentes (saldo após cada uma).
      const balances = new Map<string, number>();
      const move = async (
        type: StockMovementType,
        productId: string,
        variationId: string | null,
        locationId: string,
        amount: number,
        note?: string,
      ) => {
        const key = `${locationId}:${productId}:${variationId}`;
        const current = balances.get(key) ?? 0;
        const delta = type === "IN" ? amount : type === "OUT" ? -amount : amount - current;
        const balance = current + delta;
        balances.set(key, balance);

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId,
            variationId,
            locationId,
            type,
            quantity: delta,
            balanceAfter: balance,
            note,
            createdById: admin.id,
            createdByName: admin.name,
          },
        });
      };

      for (const [index, item] of PRODUCTS.entries()) {
        const { variations = [], ...data } = item;
        const product = await tx.product.create({ data: { ...data, tenantId } });

        // O último produto fica sem estoque, para aparecer em "Produtos sem saldo".
        if (index === PRODUCTS.length - 1) continue;

        if (variations.length === 0) {
          await move("IN", product.id, null, warehouse.id, 40 + index * 5, "Compra inicial - NF 1001");
          await move("OUT", product.id, null, warehouse.id, 6 + index, "Venda balcão");
          if (index % 2 === 0) await move("IN", product.id, null, store.id, 10, "Transferência para loja");
          continue;
        }

        for (const [vIndex, variation] of variations.entries()) {
          const created = await tx.productVariation.create({ data: { ...variation, productId: product.id, tenantId } });
          await move("IN", product.id, created.id, warehouse.id, 12 + vIndex * 3, "Compra inicial - NF 1002");
          if (vIndex === 0) await move("OUT", product.id, created.id, warehouse.id, 4, "Venda online");
          if (vIndex === 1) await move("ADJUSTMENT", product.id, created.id, warehouse.id, 10, "Inventário mensal");
        }
      }

      // Materializa os saldos finais.
      await tx.stockItem.createMany({
        data: [...balances.entries()].map(([key, quantity]) => {
          const [locationId, productId, variationId] = key.split(":");
          return { tenantId, locationId, productId, variationId: variationId === "null" ? null : variationId, quantity };
        }),
      });

      return tenantId;
    },
    { timeout: 30_000 },
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
