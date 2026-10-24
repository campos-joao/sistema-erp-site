"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryParams } from "@/components/list/use-query-params";

const ALL = "__all__";

type FilterSelectProps = {
  paramKey: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
};

export function FilterSelect({ paramKey, label, allLabel, options }: FilterSelectProps) {
  const { searchParams, setParams } = useQueryParams();
  const value = searchParams.get(paramKey) ?? ALL;

  return (
    <Select value={value} onValueChange={(next) => setParams({ [paramKey]: next === ALL ? null : next })}>
      <SelectTrigger aria-label={label} className="w-full sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
