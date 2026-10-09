import { z } from "zod";

/** Aceita "19,90", "1.234,56", "R$ 10" ou "19.90" e normaliza para "1234.56". */
const normalizeMoney = (value: string) => {
  const clean = value.replace(/R\$|\s/g, "");
  return clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
};

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto").max(150),
  sku: z
    .string()
    .trim()
    .min(1, "Informe o SKU")
    .max(60)
    .regex(/^[\w.\-/]+$/, "Use apenas letras, números, '.', '-', '_' ou '/'"),
  price: z
    .string()
    .trim()
    .min(1, "Informe o preço")
    .transform(normalizeMoney)
    .pipe(z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, "Preço inválido (ex.: 19,90)")),
});

export type CreateProductInput = z.input<typeof createProductSchema>;
