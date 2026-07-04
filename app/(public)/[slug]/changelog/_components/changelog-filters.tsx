"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import {
  CHANGELOG_LABEL_VALUES,
  CHANGELOG_LABELS,
} from "@/lib/changelog/constants";

interface ChangelogFiltersProps {
  activeLabel: string;
  activeSearch: string;
}

export function ChangelogFilters({
  activeLabel,
  activeSearch,
}: ChangelogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
      });
    },
    [router, pathname, searchParams]
  );

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updateParam({ q: value || null });
    }, 300);
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-50 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-9 w-full border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={activeSearch}
          onChange={handleSearch}
          placeholder="Search"
          type="search"
        />
        {activeSearch && (
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => updateParam({ q: null })}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <select
        className="h-9 cursor-pointer border border-border bg-background pl-3 pr-7 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(e) => updateParam({ label: e.target.value || null })}
        value={activeLabel}
      >
        <option value="">Tags</option>
        {CHANGELOG_LABEL_VALUES.map((value) => (
          <option key={value} value={value}>
            {CHANGELOG_LABELS[value].label}
          </option>
        ))}
      </select>
    </div>
  );
}
