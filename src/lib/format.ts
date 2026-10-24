const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });
const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export const formatCurrency = (value: string | number) => currency.format(Number(value));
export const formatDate = (value: string | Date) => date.format(new Date(value));
export const formatDateTime = (value: string | Date) => dateTime.format(new Date(value));
export const formatQuantity = (value: string | number) => number.format(Number(value));

/** Converte "1234.5" (formato do banco) para "1234,50" para preencher inputs. */
export const toMoneyInput = (value: string | null | undefined) =>
  value == null ? "" : Number(value).toFixed(2).replace(".", ",");

/** Descrição curta de uma variação, ex.: "Azul / M". */
export const variationLabel = (variation: { color: string | null; size: string | null }) =>
  [variation.color, variation.size].filter(Boolean).join(" / ") || "Variação";
