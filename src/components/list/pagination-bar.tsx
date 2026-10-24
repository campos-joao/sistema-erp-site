import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PAGE_SIZE, type SearchParams } from "@/lib/pagination";

type PaginationBarProps = {
  pathname: string;
  searchParams: SearchParams;
  page: number;
  total: number;
};

export function PaginationBar({ pathname, searchParams, page, total }: PaginationBarProps) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total === 0) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      const single = Array.isArray(value) ? value[0] : value;
      if (single && key !== "page") query.set(key, single);
    });
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-2">
        <span>
          Página {Math.min(page, pages)} de {pages}
        </span>
        {page > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page - 1)}>Anterior</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
        )}
        {page < pages ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page + 1)}>Próxima</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Próxima
          </Button>
        )}
      </div>
    </div>
  );
}
