import { ArrowLeft, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductFormSheet } from "@/features/products/components/product-form-sheet";
import { VariationFormSheet } from "@/features/products/components/variation-form-sheet";
import { VariationsTable } from "@/features/products/components/variations-table";
import { getProduct } from "@/features/products/queries";
import { MovementsTable } from "@/features/stock/components/movements-table";
import { NewMovementButton } from "@/features/stock/components/new-movement-button";
import { listMovements } from "@/features/stock/queries";
import { requireSession } from "@/lib/dal";
import { formatCurrency, formatQuantity, variationLabel } from "@/lib/format";
import { can } from "@/lib/permissions";

export async function generateMetadata(props: PageProps<"/produtos/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProduct(id);
  return { title: product.name };
}

export default async function ProductDetailPage(props: PageProps<"/produtos/[id]">) {
  const { id } = await props.params;
  const [session, product, movements] = await Promise.all([
    requireSession(),
    getProduct(id),
    listMovements({ produto: id }, 10),
  ]);
  const canWrite = can(session.role, "product:write");
  const canDelete = can(session.role, "product:delete");
  const variationsById = new Map(product.variations.map((v) => [v.id, v]));
  const totalStock = product.stock.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/produtos">
            <ArrowLeft />
            Produtos
          </Link>
        </Button>
      </div>
      <PageHeader title={product.name} description={`SKU ${product.sku}`}>
        {canWrite && (
          <ProductFormSheet
            product={product}
            trigger={
              <Button variant="outline">
                <Pencil />
                Editar
              </Button>
            }
          />
        )}
        <NewMovementButton productId={product.id} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Preço de venda", value: formatCurrency(product.price) },
          { label: "Custo", value: product.cost ? formatCurrency(product.cost) : "—" },
          { label: "Código de barras", value: product.barcode ?? "—" },
          { label: "Estoque total", value: formatQuantity(totalStock) },
        ].map((item) => (
          <Card key={item.label} size="sm">
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold tabular-nums">{item.value}</CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Variações</h2>
          {canWrite && (
            <VariationFormSheet
              product={product}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus />
                  Nova variação
                </Button>
              }
            />
          )}
        </div>
        <VariationsTable product={product} canWrite={canWrite} canDelete={canDelete} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Saldo por depósito</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Depósito</TableHead>
                {product.variations.length > 0 && <TableHead>Variação</TableHead>}
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.stock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                    Sem saldo em nenhum depósito.
                  </TableCell>
                </TableRow>
              ) : (
                product.stock.map((item) => {
                  const variation = item.variationId ? variationsById.get(item.variationId) : undefined;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.locationName}</TableCell>
                      {product.variations.length > 0 && (
                        <TableCell>{variation ? `${variationLabel(variation)} (${variation.sku})` : "—"}</TableCell>
                      )}
                      <TableCell
                        className={`text-right tabular-nums ${Number(item.quantity) <= 0 ? "text-destructive" : ""}`}
                      >
                        {formatQuantity(item.quantity)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Últimas movimentações</h2>
          {movements.total > movements.rows.length && (
            <Button variant="link" size="sm" asChild>
              <Link href={`/estoque/movimentacoes?produto=${product.id}`}>Ver todas</Link>
            </Button>
          )}
        </div>
        <MovementsTable movements={movements.rows} />
      </section>
    </>
  );
}
