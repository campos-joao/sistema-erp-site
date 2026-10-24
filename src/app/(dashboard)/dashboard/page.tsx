import { AlertTriangle, ArrowLeftRight, DollarSign, Package, Warehouse, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/features/dashboard/queries";
import { MovementsTable } from "@/features/stock/components/movements-table";
import { NewMovementButton } from "@/features/stock/components/new-movement-button";
import { listMovements } from "@/features/stock/queries";
import { getCurrentTenant } from "@/lib/dal";
import { formatCurrency, formatQuantity } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

function StatCard({ title, value, hint, icon: Icon }: { title: string; value: string; hint: string; icon: LucideIcon }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [tenant, stats, recent] = await Promise.all([getCurrentTenant(), getDashboardStats(), listMovements({}, 8)]);

  return (
    <>
      <PageHeader title="Dashboard" description={`Visão geral de ${tenant.name}`}>
        <NewMovementButton />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Produtos cadastrados"
          value={String(stats.productCount)}
          hint={`${stats.locationCount} ${stats.locationCount === 1 ? "depósito" : "depósitos"}`}
          icon={Package}
        />
        <StatCard
          title="Unidades em estoque"
          value={formatQuantity(stats.units)}
          hint="Soma dos saldos positivos"
          icon={Warehouse}
        />
        <StatCard
          title="Valor do estoque (custo)"
          value={formatCurrency(stats.stockValue)}
          hint={
            stats.itemsWithoutCost > 0
              ? `${stats.itemsWithoutCost} ${stats.itemsWithoutCost === 1 ? "saldo" : "saldos"} sem custo informado`
              : "Saldo × custo de cada item"
          }
          icon={DollarSign}
        />
        <StatCard
          title="Movimentações (30 dias)"
          value={String(stats.movements.total)}
          hint={`${stats.movements.in} entradas · ${stats.movements.out} saídas · ${stats.movements.adjustment} ajustes`}
          icon={ArrowLeftRight}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Últimas movimentações</h2>
            <Button variant="link" size="sm" asChild>
              <Link href="/estoque/movimentacoes">Ver todas</Link>
            </Button>
          </div>
          <MovementsTable movements={recent.rows} compact />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Produtos sem saldo
            </CardTitle>
            <CardDescription>
              {stats.outOfStockCount === 0
                ? "Todos os produtos têm saldo."
                : `${stats.outOfStockCount} ${stats.outOfStockCount === 1 ? "produto" : "produtos"} sem saldo em estoque.`}
            </CardDescription>
          </CardHeader>
          {stats.outOfStock.length > 0 && (
            <CardContent className="space-y-3">
              <ul className="divide-y">
                {stats.outOfStock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/produtos/${product.id}`} className="truncate font-medium hover:underline">
                      {product.name}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                  </li>
                ))}
              </ul>
              {stats.outOfStockCount > stats.outOfStock.length && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/produtos?estoque=sem">Ver todos</Link>
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
