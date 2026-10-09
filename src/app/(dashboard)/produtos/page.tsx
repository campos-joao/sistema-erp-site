import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { listProducts } from "@/features/products/actions";
import { NewProductSheet } from "@/features/products/components/new-product-sheet";
import { ProductsTable } from "@/features/products/components/products-table";

export const metadata: Metadata = { title: "Produtos" };

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <>
      <PageHeader title="Produtos" description="Gerencie o catálogo de produtos da sua empresa">
        <NewProductSheet />
      </PageHeader>
      <ProductsTable products={products} />
    </>
  );
}
