import { Warehouse } from "lucide-react";
import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BalanceRow } from "@/features/stock/queries";
import { formatCurrency, formatDateTime, formatQuantity, variationLabel } from "@/lib/format";

export function BalancesTable({ balances, filtered }: { balances: BalanceRow[]; filtered: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Depósito</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Valor (custo)</TableHead>
            <TableHead className="text-right">Atualizado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Warehouse className="size-8" />
                  {filtered
                    ? "Nenhum saldo encontrado com esses filtros."
                    : "Nenhum saldo ainda. Registre uma entrada para começar."}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            balances.map((item) => {
              const qty = Number(item.quantity);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/produtos/${item.productId}`} className="font-medium hover:underline">
                      {item.productName}
                    </Link>
                    {item.variation && (
                      <div className="text-xs text-muted-foreground">{variationLabel(item.variation)}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell>{item.location.name}</TableCell>
                  <TableCell className={`text-right font-medium tabular-nums ${qty <= 0 ? "text-destructive" : ""}`}>
                    {formatQuantity(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {item.unitCost ? formatCurrency(qty * Number(item.unitCost)) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatDateTime(item.updatedAt)}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
