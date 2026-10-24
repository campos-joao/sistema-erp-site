"use client";

import { Layers, Pencil, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteVariation } from "@/features/products/actions";
import { VariationFormSheet } from "@/features/products/components/variation-form-sheet";
import type { ProductDetail } from "@/features/products/queries";
import { formatCurrency, formatQuantity, variationLabel } from "@/lib/format";

type VariationsTableProps = {
  product: ProductDetail;
  canWrite: boolean;
  canDelete: boolean;
};

export function VariationsTable({ product, canWrite, canDelete }: VariationsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Cor</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Cód. de barras</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Estoque</TableHead>
            {(canWrite || canDelete) && <TableHead className="w-20" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {product.variations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Layers className="size-8" />
                  Este produto não tem variações. O estoque é controlado no próprio produto.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            product.variations.map((variation) => (
              <TableRow key={variation.id}>
                <TableCell className="font-medium">{variation.color ?? "—"}</TableCell>
                <TableCell>{variation.size ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{variation.sku}</TableCell>
                <TableCell className="text-muted-foreground">{variation.barcode ?? "—"}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {variation.cost || product.cost ? formatCurrency((variation.cost ?? product.cost)!) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(variation.price ?? product.price)}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${Number(variation.stock) <= 0 ? "text-destructive" : ""}`}
                >
                  {formatQuantity(variation.stock)}
                </TableCell>
                {(canWrite || canDelete) && (
                  <TableCell>
                    <div className="flex justify-end">
                      {canWrite && (
                        <VariationFormSheet
                          product={product}
                          variation={variation}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label="Editar variação" title="Editar">
                              <Pencil />
                            </Button>
                          }
                        />
                      )}
                      {canDelete && (
                        <ConfirmDialog
                          title="Excluir variação?"
                          description={
                            <>
                              A variação <strong>{variationLabel(variation)}</strong> ({variation.sku}) e seu histórico
                              de movimentações serão excluídos permanentemente.
                            </>
                          }
                          successMessage="Variação excluída"
                          action={() => deleteVariation(variation.id)}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label="Excluir variação" title="Excluir">
                              <Trash2 className="text-destructive" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
