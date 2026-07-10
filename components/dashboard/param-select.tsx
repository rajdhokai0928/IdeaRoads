"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParamSelectProps {
  options: { label: string; value: string }[];
  paramName: string;
  value: string;
}

// A shared Select bound to a URL search param — changing it triggers a server
// re-render with the new filter applied (same pattern as BoardFilters),
// reused here for the Breakdown period and Live Stream activity type.
export function ParamSelect({ paramName, value, options }: ParamSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(newValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, newValue);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <Select onValueChange={handleChange} value={value}>
      <SelectTrigger className="text-xs text-ir-muted" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
