import { z } from "zod";

import { money, optionalMoney, optionalText, skuSchema } from "@/lib/schema-helpers";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto").max(150),
  sku: skuSchema,
  barcode: optionalText(50),
  price: money("Informe o preço"),
  cost: optionalMoney(),
});

export type ProductInput = z.input<typeof productSchema>;
export type ProductData = z.output<typeof productSchema>;

export const variationSchema = z
  .object({
    sku: skuSchema,
    barcode: optionalText(50),
    color: optionalText(50),
    size: optionalText(30),
    price: optionalMoney(),
    cost: optionalMoney(),
  })
  .refine((data) => data.color || data.size, {
    message: "Informe a cor e/ou o tamanho",
    path: ["color"],
  });

export type VariationInput = z.input<typeof variationSchema>;
export type VariationData = z.output<typeof variationSchema>;

export const PRODUCT_TYPE_FILTERS = [
  { value: "simples", label: "Sem variações" },
  { value: "variacoes", label: "Com variações" },
];

export const PRODUCT_STOCK_FILTERS = [
  { value: "com", label: "Com saldo" },
  { value: "sem", label: "Sem saldo" },
];
