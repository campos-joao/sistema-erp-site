import type { Metadata } from "next";

import { FilterSelect } from "@/components/list/filter-select";
import { PaginationBar } from "@/components/list/pagination-bar";
import { SearchInput } from "@/components/list/search-input";
import { MovementsTable } from "@/features/stock/components/movements-table";
import { listLocationOptions, listMovements } from "@/features/stock/queries";
import { MOVEMENT_TYPE_FILTERS } from "@/features/stock/schemas";

export const metadata: Metadata = { title: "Movimentações" };

export default async function MovementsPage(props: PageProps<"/estoque/movimentacoes">) {
  const searchParams = await props.searchParams;
  const [{ rows, total, page }, locations] = await Promise.all([listMovements(searchParams), listLocationOptions()]);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput placeholder="Buscar produto, SKU, cor ou tamanho" />
        <FilterSelect paramKey="tipo" label="Tipo" allLabel="Todos os tipos" options={MOVEMENT_TYPE_FILTERS} />
        <FilterSelect
          paramKey="deposito"
          label="Depósito"
          allLabel="Todos os depósitos"
          options={locations.map((l) => ({ value: l.id, label: l.name }))}
        />
      </div>
      <MovementsTable movements={rows} />
      <PaginationBar pathname="/estoque/movimentacoes" searchParams={searchParams} page={page} total={total} />
    </>
  );
}
