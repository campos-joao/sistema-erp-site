"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteLocation } from "@/features/stock/actions";
import { LocationFormDialog } from "@/features/stock/components/location-form-dialog";
import type { LocationRow } from "@/features/stock/queries";
import { formatDate, formatQuantity } from "@/lib/format";

export function LocationsTable({ locations, canManage }: { locations: LocationRow[]; canManage: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="text-right">Itens com saldo</TableHead>
            <TableHead className="text-right">Quantidade total</TableHead>
            <TableHead className="text-right">Criado em</TableHead>
            {canManage && <TableHead className="w-20" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">
                <Link href={`/estoque?deposito=${location.id}`} className="hover:underline">
                  {location.name}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">{location.itemsWithStock}</TableCell>
              <TableCell className="text-right tabular-nums">{formatQuantity(location.totalQuantity)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatDate(location.createdAt)}</TableCell>
              {canManage && (
                <TableCell>
                  <div className="flex justify-end">
                    <LocationFormDialog
                      location={location}
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Renomear ${location.name}`} title="Renomear">
                          <Pencil />
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      title="Excluir depósito?"
                      description={
                        <>
                          O depósito <strong>{location.name}</strong> e o histórico de movimentações dele serão
                          excluídos. Só é possível excluir depósitos sem saldo.
                        </>
                      }
                      successMessage="Depósito excluído"
                      action={() => deleteLocation(location.id)}
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${location.name}`} title="Excluir">
                          <Trash2 className="text-destructive" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
