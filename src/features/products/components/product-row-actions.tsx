"use client";

import { Layers, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/features/products/actions";
import { ProductFormSheet } from "@/features/products/components/product-form-sheet";
import type { ProductRow } from "@/features/products/queries";

export function ProductRowActions({ product, canDelete }: { product: ProductRow; canDelete: boolean }) {
  return (
    <div className="flex justify-end">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href={`/produtos/${product.id}`} aria-label={`Variações e estoque de ${product.name}`} title="Variações e estoque">
          <Layers />
        </Link>
      </Button>
      <ProductFormSheet
        product={product}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${product.name}`} title="Editar">
            <Pencil />
          </Button>
        }
      />
      {canDelete && (
        <ConfirmDialog
          title="Excluir produto?"
          description={
            <>
              <strong>{product.name}</strong>, suas variações e o histórico de movimentações serão excluídos
              permanentemente.
            </>
          }
          successMessage="Produto excluído"
          action={() => deleteProduct(product.id)}
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${product.name}`} title="Excluir">
              <Trash2 className="text-destructive" />
            </Button>
          }
        />
      )}
    </div>
  );
}
