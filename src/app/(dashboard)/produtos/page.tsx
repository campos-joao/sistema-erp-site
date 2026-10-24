import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { FilterSelect } from "@/components/list/filter-select";
import { PaginationBar } from "@/components/list/pagination-bar";
import { SearchInput } from "@/components/list/search-input";
import { Button } from "@/components/ui/button";
import { ProductFormSheet } from "@/features/products/components/product-form-sheet";
import { ProductsTable } from "@/features/products/components/products-table";
import { listProducts } from "@/features/products/queries";
import { PRODUCT_STOCK_FILTERS, PRODUCT_TYPE_FILTERS } from "@/features/products/schemas";
import { requireSession } from "@/lib/dal";
import { param } from "@/lib/pagination";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Produtos" };

export default async function ProductsPage(props: PageProps<"/produtos">) {
  const searchParams = await props.searchParams;
  const [session, { rows, total, page }] = await Promise.all([requireSession(), listProducts(searchParams)]);
  const filtered = ["q", "tipo", "estoque"].some((key) => param(searchParams, key));

  return (
    <>
      <PageHeader title="Produtos" description="Gerencie o catálogo de produtos da sua empresa">
        {can(session.role, "product:write") && (
          <ProductFormSheet
            trigger={
              <Button>
                <Plus />
                Novo produto
              </Button>
            }
          />
        )}
      </PageHeader>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput placeholder="Buscar por nome, SKU ou código de barras" />
        <FilterSelect paramKey="tipo" label="Tipo" allLabel="Todos os tipos" options={PRODUCT_TYPE_FILTERS} />
        <FilterSelect paramKey="estoque" label="Estoque" allLabel="Qualquer saldo" options={PRODUCT_STOCK_FILTERS} />
      </div>
      <ProductsTable products={rows} canDelete={can(session.role, "product:delete")} filtered={filtered} />
      <PaginationBar pathname="/produtos" searchParams={searchParams} page={page} total={total} />
    </>
  );
}
