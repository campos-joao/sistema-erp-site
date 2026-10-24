import { Package } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductRowActions } from "@/features/products/components/product-row-actions";
import type { ProductRow } from "@/features/products/queries";
import { formatCurrency, formatQuantity } from "@/lib/format";

type ProductsTableProps = {
  products: ProductRow[];
  canDelete: boolean;
  filtered: boolean;
};

export function ProductsTable({ products, canDelete, filtered }: ProductsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Cód. de barras</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Estoque</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Package className="size-8" />
                  {filtered ? "Nenhum produto encontrado com esses filtros." : "Nenhum produto cadastrado ainda."}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Link href={`/produtos/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                    {product.variationCount > 0 && (
                      <Badge variant="secondary">
                        {product.variationCount} {product.variationCount === 1 ? "variação" : "variações"}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                <TableCell className="text-muted-foreground">{product.barcode ?? "—"}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {product.cost ? formatCurrency(product.cost) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(product.price)}</TableCell>
                <TableCell
                  className={`text-right tabular-nums ${Number(product.stock) <= 0 ? "text-destructive" : ""}`}
                >
                  {formatQuantity(product.stock)}
                </TableCell>
                <TableCell>
                  <ProductRowActions product={product} canDelete={canDelete} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
