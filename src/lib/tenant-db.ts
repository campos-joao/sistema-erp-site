import "server-only";

import { prisma } from "@/lib/db";

const TENANT_SCOPED_MODELS = new Set([
  "User",
  "Product",
  "ProductVariation",
  "StockLocation",
  "StockItem",
]);

const WHERE_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "delete",
  "deleteMany",
  "upsert",
]);

const CREATE_OPERATIONS = new Set(["create", "createMany", "createManyAndReturn"]);

type AnyArgs = Record<string, unknown> & {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
};

/**
 * Retorna um Prisma Client que injeta `tenantId` automaticamente em toda
 * query dos models multi-tenant (filtros em leituras/updates/deletes e valor
 * forçado em creates). Qualquer `tenantId` vindo do chamador é sobrescrito.
 *
 * Observação: escritas aninhadas (nested writes) não são interceptadas;
 * prefira operações diretas em cada model.
 */
export function forTenant(tenantId: string) {
  if (!tenantId) throw new Error("tenantId é obrigatório");

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model)) return query(args);

          const scoped = { ...(args as AnyArgs) };

          if (WHERE_OPERATIONS.has(operation)) {
            scoped.where = { ...scoped.where, tenantId };
          }

          if (operation === "upsert") {
            scoped.create = { ...scoped.create, tenantId };
          }

          if (CREATE_OPERATIONS.has(operation)) {
            scoped.data = Array.isArray(scoped.data)
              ? scoped.data.map((row) => ({ ...row, tenantId }))
              : { ...scoped.data, tenantId };
          }

          return query(scoped as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof forTenant>;
