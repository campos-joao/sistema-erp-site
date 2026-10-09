const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export const formatCurrency = (value: string | number) => currency.format(Number(value));
export const formatDate = (value: string | Date) => date.format(new Date(value));
