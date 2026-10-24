import { z } from "zod";

/** Aceita "19,90", "1.234,56", "R$ 10" ou "19.90" e normaliza para "1234.56". */
export const normalizeDecimal = (value: string) => {
  const clean = value.replace(/R\$|\s/g, "");
  return clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
};

const decimalRegex = (scale: number) => new RegExp(`^\\d{1,10}(\\.\\d{1,${scale}})?$`);

/** Valor monetário obrigatório (2 casas), normalizado para "1234.56". */
export const money = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .transform(normalizeDecimal)
    .pipe(z.string().regex(decimalRegex(2), "Valor inválido (ex.: 19,90)"));

/** Valor monetário opcional: string vazia vira `null`. */
export const optionalMoney = () =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : normalizeDecimal(value)))
    .pipe(z.string().regex(decimalRegex(2), "Valor inválido (ex.: 19,90)").nullable());

/** Quantidade (até 3 casas, para itens fracionados como kg). */
export const quantity = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .transform(normalizeDecimal)
    .pipe(z.string().regex(decimalRegex(3), "Quantidade inválida (ex.: 10 ou 2,5)"));

/** Texto opcional: string vazia vira `null`. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .transform((value) => (value === "" ? null : value));

/** Id opcional vindo de selects: string vazia vira `null`. */
export const optionalId = () =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value));

export const skuSchema = z
  .string()
  .trim()
  .min(1, "Informe o SKU")
  .max(60)
  .regex(/^[\w.\-/]+$/, "Use apenas letras, números, '.', '-', '_' ou '/'");
