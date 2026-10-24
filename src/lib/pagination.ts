export const PAGE_SIZE = 20;

export type SearchParams = Record<string, string | string[] | undefined>;

/** Lê um parâmetro de busca como string única. */
export const param = (params: SearchParams, key: string) => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
};

/** Lê `?page=` com valor mínimo 1 e calcula `skip`/`take` para o Prisma. */
export function pageParams(params: SearchParams) {
  const page = Math.max(1, Math.floor(Number(param(params, "page")) || 1));
  return { page, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

export const totalPages = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));
