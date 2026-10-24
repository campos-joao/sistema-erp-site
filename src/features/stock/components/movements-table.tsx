import { History } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MovementRow } from "@/features/stock/queries";
import { MOVEMENT_TYPE_LABELS } from "@/features/stock/schemas";
import { formatDateTime, formatQuantity, variationLabel } from "@/lib/format";

const TYPE_VARIANTS = { IN: "default", OUT: "destructive", ADJUSTMENT: "secondary" } as const;

export function MovementsTable({ movements, compact = false }: { movements: MovementRow[]; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Produto</TableHead>
            {!compact && <TableHead>Depósito</TableHead>}
            <TableHead className="text-right">Qtd.</TableHead>
            <TableHead className="text-right">Saldo após</TableHead>
            {!compact && <TableHead>Usuário</TableHead>}
            {!compact && <TableHead>Observação</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 5 : 8} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <History className="size-8" />
                  Nenhuma movimentação registrada.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            movements.map((m) => {
              const qty = Number(m.quantity);
              return (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(m.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANTS[m.type]}>{MOVEMENT_TYPE_LABELS[m.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/produtos/${m.productId}`} className="font-medium hover:underline">
                      {m.productName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {m.variation ? `${variationLabel(m.variation)} · ` : ""}
                      <span className="font-mono">{m.sku}</span>
                    </div>
                  </TableCell>
                  {!compact && <TableCell>{m.locationName}</TableCell>}
                  <TableCell
                    className={`text-right tabular-nums ${qty < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    {qty > 0 ? "+" : ""}
                    {formatQuantity(m.quantity)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatQuantity(m.balanceAfter)}</TableCell>
                  {!compact && <TableCell className="text-muted-foreground">{m.createdByName}</TableCell>}
                  {!compact && (
                    <TableCell className="max-w-48 truncate text-muted-foreground" title={m.note ?? undefined}>
                      {m.note ?? "—"}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
