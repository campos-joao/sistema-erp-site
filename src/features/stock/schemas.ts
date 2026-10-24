import { z } from "zod";

import { optionalId, optionalText, quantity } from "@/lib/schema-helpers";

export const movementSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"], "Selecione o tipo"),
  locationId: z.string().min(1, "Selecione o depósito"),
  productId: z.string().min(1, "Selecione o produto"),
  variationId: optionalId(),
  quantity: quantity("Informe a quantidade"),
  note: optionalText(500),
});

export type MovementInput = z.input<typeof movementSchema>;
export type MovementData = z.output<typeof movementSchema>;

export const locationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do depósito").max(80),
});

export type LocationInput = z.input<typeof locationSchema>;

export const MOVEMENT_TYPE_LABELS: Record<MovementInput["type"], string> = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUSTMENT: "Ajuste",
};

export const MOVEMENT_TYPE_FILTERS = [
  { value: "IN", label: "Entradas" },
  { value: "OUT", label: "Saídas" },
  { value: "ADJUSTMENT", label: "Ajustes" },
];

export const BALANCE_FILTERS = [
  { value: "positivo", label: "Com saldo" },
  { value: "zerado", label: "Zerados" },
  { value: "negativo", label: "Negativos" },
];
