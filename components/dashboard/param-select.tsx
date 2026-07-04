"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface ParamSelectProps {
  options: { label: string; value: string }[];
  paramName: string;
  value: string;
}

// A <select> bound to a URL search param — changing it triggers a server
// re-render with the new filter applied (same pattern as BoardFilters),
// reused here for the Breakdown period and Live Stream activity type.
export function ParamSelect({ paramName, value, options }: ParamSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, e.target.value);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <select
      className="h-7 cursor-pointer border-0 bg-transparent pr-6 pl-1 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      onChange={handleChange}
      value={value}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
