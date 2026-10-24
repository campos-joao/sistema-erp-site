import type { Metadata } from "next";

import { FilterSelect } from "@/components/list/filter-select";
import { PaginationBar } from "@/components/list/pagination-bar";
import { SearchInput } from "@/components/list/search-input";
import { BalancesTable } from "@/features/stock/components/balances-table";
import { listBalances, listLocationOptions } from "@/features/stock/queries";
import { BALANCE_FILTERS } from "@/features/stock/schemas";
import { param } from "@/lib/pagination";

export const metadata: Metadata = { title: "Estoque" };

export default async function StockPage(props: PageProps<"/estoque">) {
  const searchParams = await props.searchParams;
  const [{ rows, total, page }, locations] = await Promise.all([listBalances(searchParams), listLocationOptions()]);
  const filtered = ["q", "deposito", "saldo"].some((key) => param(searchParams, key));

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput placeholder="Buscar produto, SKU, cor ou tamanho" />
        <FilterSelect
          paramKey="deposito"
          label="Depósito"
          allLabel="Todos os depósitos"
          options={locations.map((l) => ({ value: l.id, label: l.name }))}
        />
        <FilterSelect paramKey="saldo" label="Saldo" allLabel="Qualquer saldo" options={BALANCE_FILTERS} />
      </div>
      <BalancesTable balances={rows} filtered={filtered} />
      <PaginationBar pathname="/estoque" searchParams={searchParams} page={page} total={total} />
    </>
  );
}
