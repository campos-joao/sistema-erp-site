"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useQueryParams } from "@/components/list/use-query-params";

export function SearchInput({ placeholder = "Buscar...", paramKey = "q" }: { placeholder?: string; paramKey?: string }) {
  const { searchParams, setParams, pending } = useQueryParams();
  const current = searchParams.get(paramKey) ?? "";
  const [value, setValue] = useState(current);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = (next: string) => {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (next.trim() !== current) setParams({ [paramKey]: next.trim() || null });
    }, 350);
  };

  return (
    <div className="relative w-full sm:max-w-xs">
      {pending ? (
        <Loader2 className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </div>
  );
}
