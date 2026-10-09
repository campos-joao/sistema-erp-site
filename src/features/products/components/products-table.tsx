import { Package } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductRow } from "@/features/products/actions";
import { formatCurrency, formatDate } from "@/lib/format";

export function ProductsTable({ products }: { products: ProductRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Cód. de barras</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Cadastrado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Package className="size-8" />
                  Nenhum produto cadastrado ainda.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                <TableCell className="text-muted-foreground">{product.barcode ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDate(product.createdAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
