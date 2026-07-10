"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { SearchInput } from "@/components/ui/search-input";

interface ListSearchProps {
  defaultValue: string;
  placeholder?: string;
}

// Debounced URL-backed search bar for admin/team list pages. Writes the `q`
// search param (preserving any other params) and lets the server re-query — the
// same pattern the public roadmap/changelog filters use.
export function ListSearch({
  defaultValue,
  placeholder = "Search",
}: ListSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="border-border px-4 py-4 sm:px-8">
      <SearchInput
        aria-label={placeholder}
        className="h-9 min-w-50 max-w-md"
        defaultValue={defaultValue}
        onSearch={update}
        placeholder={placeholder}
      />
    </div>
  );
}
